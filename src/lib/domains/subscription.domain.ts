export enum SubscriptionPlan {
    FREE = "FREE",
    PREMIUM = "PREMIUM"
}

export enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}

export interface BaseSubscription {
    user_id: string;
    plan_type: SubscriptionPlan;
    status: SubscriptionStatus;
    starts_at: Date;
    expires_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface Subscription extends BaseSubscription {
    id: string;
}

export interface SubscriptionPlanDetails {
    plan: SubscriptionPlan;
    name: string;
    description: string;
    price: number;
    features: string[];
    aiToolsAccess: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanDetails> = {
    [SubscriptionPlan.FREE]: {
        plan: SubscriptionPlan.FREE,
        name: "Free Plan",
        description: "Basic access to job search and applications",
        price: 0,
        features: [
            "Apply to jobs",
            "Basic job search",
            "Create profile",
            "Limited job recommendations"
        ],
        aiToolsAccess: false
    },
    [SubscriptionPlan.PREMIUM]: {
        plan: SubscriptionPlan.PREMIUM,
        name: "Premium Plan",
        description: "Full access to all features including AI tools",
        price: 19.99,
        features: [
            "All Free Plan features",
            "Full access to AI Mock Interviews",
            "AI Resume Analysis",
            "AI Job Recommendations",
            "Advanced job search filters",
            "Priority application processing"
        ],
        aiToolsAccess: true
    }
};