import { createMachine, assign } from 'xstate';

export type SubscriptionStatus = 'ON' | 'OFF' | 'SUSPENDED' | 'EXPIRED';

export interface SubscriptionContext {
  isTrial: boolean;
  status: SubscriptionStatus;
  startDate?: Date;
  endDate?: Date;
  suspensionReason?: string;
}

export type SubscriptionEvent =
  | { type: 'ACTIVATE'; isTrial?: boolean }
  | { type: 'DEACTIVATE' }
  | { type: 'SUSPEND'; reason?: string }
  | { type: 'RESUME' }
  | { type: 'EXPIRE' }
  | { type: 'CONVERT_TO_PAID' };

export const subscriptionMachine = createMachine({
  id: 'subscription',
  initial: 'off',
  types: {} as {
    context: SubscriptionContext;
    events: SubscriptionEvent;
  },
  context: {
    isTrial: false,
    status: 'OFF',
  },
  states: {
    off: {
      entry: assign({
        status: 'OFF',
      }),
      on: {
        ACTIVATE: {
          target: 'active',
          actions: assign({
            isTrial: ({ event }) => event.isTrial ?? false,
            status: 'ON',
            startDate: () => new Date(),
          }),
        },
      },
    },
    active: {
      entry: assign({
        status: 'ON',
      }),
      on: {
        DEACTIVATE: 'off',
        SUSPEND: {
          target: 'suspended',
          actions: assign({
            suspensionReason: ({ event }) => event.reason,
          }),
        },
        EXPIRE: 'expired',
        CONVERT_TO_PAID: {
          actions: assign({
            isTrial: false,
          }),
          guard: ({ context }) => context.isTrial,
        },
      },
    },
    suspended: {
      entry: assign({
        status: 'SUSPENDED',
      }),
      on: {
        RESUME: 'active',
        DEACTIVATE: 'off',
        EXPIRE: 'expired',
      },
    },
    expired: {
      entry: assign({
        status: 'EXPIRED',
        endDate: () => new Date(),
      }),
      on: {
        ACTIVATE: {
          target: 'active',
          actions: assign({
            isTrial: ({ event }) => event.isTrial ?? false,
            status: 'ON',
            startDate: () => new Date(),
            endDate: undefined,
          }),
        },
      },
    },
  },
});
