import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get(':userId')
  getSubscription(@Param('userId') userId: string) {
    return {
      state: this.subscriptionService.getCurrentStatus(userId),
      context: this.subscriptionService.getSubscriptionState(userId),
    };
  }

  @Post(':userId/activate')
  activateSubscription(
    @Param('userId') userId: string,
    @Body('isTrial') isTrial?: boolean,
  ) {
    return this.subscriptionService.activateSubscription(userId, isTrial);
  }

  @Post(':userId/deactivate')
  deactivateSubscription(@Param('userId') userId: string) {
    return this.subscriptionService.deactivateSubscription(userId);
  }

  @Post(':userId/suspend')
  suspendSubscription(
    @Param('userId') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.subscriptionService.suspendSubscription(userId, reason);
  }

  @Post(':userId/resume')
  resumeSubscription(@Param('userId') userId: string) {
    return this.subscriptionService.resumeSubscription(userId);
  }

  @Post(':userId/expire')
  expireSubscription(@Param('userId') userId: string) {
    return this.subscriptionService.expireSubscription(userId);
  }

  @Post(':userId/convert-to-paid')
  convertTrialToPaid(@Param('userId') userId: string) {
    return this.subscriptionService.convertTrialToPaid(userId);
  }
}