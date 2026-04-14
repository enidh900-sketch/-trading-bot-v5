interface SafetyConfig {
  maxSpreadPips: number;
  maxPortfolioHeat: number;
  newsFreezeMinutes: number;
  mode: 'paper' | 'live';
}

interface SafetyCheck {
  allowed: boolean;
  reason?: string;
}

export interface TradeContext {
  symbol: string;
  spreadPips: number;
  currentHeat: number;
  hasHighImpactNewsInWindow: boolean;
  isSessionOpen: boolean;
}

export function createSafetyGuard(config: SafetyConfig) {
  function check(ctx: TradeContext): SafetyCheck {
    if (!ctx.isSessionOpen) {
      return { allowed: false, reason: 'SESSION_CLOSED' };
    }
    if (ctx.spreadPips > config.maxSpreadPips) {
      return {
        allowed: false,
        reason: `SPREAD_TOO_WIDE: ${ctx.spreadPips} > ${config.maxSpreadPips}`,
      };
    }
    if (ctx.currentHeat >= config.maxPortfolioHeat) {
      return {
        allowed: false,
        reason: `PORTFOLIO_HEAT: ${ctx.currentHeat} >= ${config.maxPortfolioHeat}`,
      };
    }
    if (ctx.hasHighImpactNewsInWindow) {
      return {
        allowed: false,
        reason: `NEWS_FREEZE: high impact news within ${config.newsFreezeMinutes} min`,
      };
    }
    return { allowed: true };
  }

  return { check };
}

export type SafetyGuard = ReturnType<typeof createSafetyGuard>;
