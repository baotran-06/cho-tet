import config from '../config/market.json' with {type:'json'};

export const marketConfig = config;
export const preparationTime = 2400;
export const deliveryTime = 8300;
export const showTime = 5200;
export const orderDuration = preparationTime + deliveryTime;

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
    this.notices = [];
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
    const item = config.products[product];
    const order = {
      id:event.id, user:event.user.name, product, source:event.source,
      quantity:Math.max(1, Math.trunc(event.count)), stall:item.stall, show:Boolean(item.show)
    };
    this.pending.push(order);
    this.notices.unshift(order);
    this.notices.length = Math.min(this.notices.length, 12);
  }

  tick(now) {
    this.active = this.active.filter(order => {
      if (!order.end || now < order.end) return true;
      const previousLevel = this.level;
      if (!order.show) {
        this.total += order.quantity;
        this.counts[order.product] = (this.counts[order.product] ?? 0) + order.quantity;
      }
      this.recent.unshift({...order, delivered:now});
      this.recent.length = Math.min(this.recent.length, 12);
      if (this.level > previousLevel) this.celebrationUntil = now + 5500;
      return false;
    });

    const busy = new Set(this.active.filter(order => !order.show && !order.departure).map(order => order.stall));
    const shows = new Set(this.active.filter(order => order.show).map(order => order.product));
    const waiting = [];
    for (const order of this.pending) {
      const slots = order.show ? shows : busy;
      const slot = order.show ? order.product : order.stall;
      if (slots.has(slot)) {
        waiting.push(order);
        continue;
      }
      slots.add(slot);
      this.active.push({...order, started:now, end:order.show?now+showTime:null});
    }
    this.pending = waiting;

    if (!this.active.some(order => order.departure)) {
      const next = this.active.filter(order => !order.show).find(order => now >= order.started + preparationTime);
      if (next) {
        next.departure = now;
        next.end = now + deliveryTime;
      }
    }
  }

  get level() {
    return config.milestones.filter(milestone => this.total >= milestone).length;
  }

  snapshot() {
    return {
      active:this.active, recent:this.recent, notices:this.notices, total:this.total, counts:this.counts,
      pending:this.pending.length, dropped:this.dropped, unmapped:this.unmapped,
      level:this.level, target:config.milestones[this.level] ?? null,
      celebrationUntil:this.celebrationUntil, rules:this.rules
    };
  }
}
