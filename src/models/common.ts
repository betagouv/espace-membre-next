export type AlertMessageType = {
    title: string;
    message: NonNullable<React.ReactNode>;
    type: "success" | "warning";
};
