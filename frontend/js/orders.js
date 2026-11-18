import config from '../config/market.json' with {type:'json'};

export const marketConfig = config;
export const orderDuration = 7800;
export const pickupTime = 3300;
export const handoffTime = 4400;

export function giftProduct(event, rules = config) {
  const name = String(event.giftName ?? '').normalize('NFC').trim().toLowerCase();
  const id = String(event.giftId ?? '');
  const key = (Object.hasOwn(rules.byId, id) && rules.byId[id]) ||
    (Object.hasOwn(rules.byName, name) && rules.byName[name]);
  return key && Object.hasOwn(config.products, key) ? key : null;
}

export class MarketOrders {
  constructor(rules = config) {
    this.rules = rules;
    this.pending = [];
    this.active = [];
    this.recent = [];
    this.counts = {};
    this.total = 0;
    this.unmapped = 0;
    this.dropped = 0;
    this.celebrationUntil = 0;
  }

  accept(event) {
    const product = giftProduct(event, this.rules);
    if (!product) {
      this.unmapped++;
      return;
    }
    if (this.pending.length >= 300) {
      this.dropped++;
      return;
    }
    this.pending.push({
      id:event.id, user:event.user.name, product, source:event.source,
      quantity:Math.max(1, Math.trunc(event.count)), stall:config.products[product].stall
    });
  }

  tick(now) {
    this.active = this.active.filter(order => {
      if (now < order.started + orderDuration) return true;
      const previousLevel = this.level;
      this.total += order.quantity;
      this.counts[order.product] = (this.counts[order.product] ?? 0) + order.quantity;
      this.recent.unshift({...order, delivered:now});
      this.recent.length = Math.min(this.recent.length, 12);
      if (this.level > previousLevel || config.products[order.product].celebrate) {
        this.celebrationUntil = now + 5500;
      }
      return false;
    });

    const busy = new Set(this.active.map(order => order.stall));
    for (let index = 0; index < this.pending.length;) {
      const order = this.pending[index];
      if (busy.has(order.stall)) {
        index++;
        continue;
      }
      this.pending.splice(index, 1);
      this.active.push({...order, started:now});
      busy.add(order.stall);
    }
  }

  get level() {
    return config.milestones.filter(milestone => this.total >= milestone).length;
  }

  snapshot() {
    return {
      active:this.active, recent:this.recent, total:this.total, counts:this.counts,
      pending:this.pending.length, dropped:this.dropped, unmapped:this.unmapped,
      level:this.level, target:config.milestones[this.level] ?? null,
      celebrationUntil:this.celebrationUntil, rules:this.rules
    };
  }
}
