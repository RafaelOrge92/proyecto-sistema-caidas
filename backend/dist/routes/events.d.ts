export declare const getEvents: () => ({
    id: string;
    deviceId: string;
    deviceAlias: string;
    patientName: string;
    eventType: string;
    status: string;
    occurredAt: string;
    createdAt: string;
    reviewedBy: null;
    reviewedAt: null;
    reviewComment: null;
} | {
    id: string;
    deviceId: string;
    deviceAlias: string;
    patientName: string;
    eventType: string;
    status: string;
    occurredAt: string;
    createdAt: string;
    reviewedBy: string;
    reviewedAt: string;
    reviewComment: string;
})[];
export declare const setEvents: (newEvents: any[]) => void;
export declare const eventsRoutes: import("express-serve-static-core").Router;
//# sourceMappingURL=events.d.ts.map