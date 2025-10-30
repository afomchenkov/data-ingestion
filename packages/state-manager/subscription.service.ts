import { Injectable, Logger } from '@nestjs/common';
import { createActor } from 'xstate';
import { subscriptionMachine, SubscriptionContext, SubscriptionEvent } from './subscription.machine';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private actors = new Map<string, ReturnType<typeof createActor>>();

  getOrCreateActor(userId: string) {
    if (!this.actors.has(userId)) {
      const actor = createActor(subscriptionMachine);
      actor.subscribe((state) => {
        this.logger.log(`User ${userId} subscription state: ${state.value}`, state.context);
      });
      actor.start();
      this.actors.set(userId, actor);
    }
    return this.actors.get(userId)!;
  }

  activateSubscription(userId: string, isTrial: boolean = false) {
    const actor = this.getOrCreateActor(userId);
    actor.send({ type: 'ACTIVATE', isTrial });
    return actor.getSnapshot().context;
  }

  deactivateSubscription(userId: string) {
    const actor = this.getOrCreateActor(userId);
    actor.send({ type: 'DEACTIVATE' });
    return actor.getSnapshot().context;
  }

  suspendSubscription(userId: string, reason?: string) {
    const actor = this.getOrCreateActor(userId);
    actor.send({ type: 'SUSPEND', reason });
    return actor.getSnapshot().context;
  }

  resumeSubscription(userId: string) {
    const actor = this.getOrCreateActor(userId);
    actor.send({ type: 'RESUME' });
    return actor.getSnapshot().context;
  }

  expireSubscription(userId: string) {
    const actor = this.getOrCreateActor(userId);
    actor.send({ type: 'EXPIRE' });
    return actor.getSnapshot().context;
  }

  convertTrialToPaid(userId: string) {
    const actor = this.getOrCreateActor(userId);
    actor.send({ type: 'CONVERT_TO_PAID' });
    return actor.getSnapshot().context;
  }

  getSubscriptionState(userId: string): SubscriptionContext {
    const actor = this.getOrCreateActor(userId);
    return actor.getSnapshot().context;
  }

  getCurrentStatus(userId: string): string {
    const actor = this.getOrCreateActor(userId);
    return actor.getSnapshot().value as string;
  }
}