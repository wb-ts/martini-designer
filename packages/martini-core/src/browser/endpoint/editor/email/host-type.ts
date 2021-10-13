export interface HostType {
    name: string;
    host: string;
    port: number;
    ssl: boolean;
    protocol?: "imap" | "pop3";
    usernameTemplate: string;
    from?: string;
}

export namespace HostType {
    export function isValidUsername(username: string, hostType: HostType): boolean {
        return !!username && hostType.usernameTemplate.endsWith(username.split("@")[1] || "");
    }

    export function convertUsername(username: string, hostType: HostType): string {
        return hostType.usernameTemplate.replace("<username>", username.split("@")[0] || "<username>");
    }
}

export const hostTypes: HostType[] = [
    {
        name: "Gmail (IMAP)",
        host: "imap.gmail.com",
        port: 993,
        usernameTemplate: "<username>@gmail.com",
        protocol: "imap",
        ssl: true
    },
    {
        name: "Gmail (POP3)",
        host: "pop.gmail.com",
        port: 995,
        usernameTemplate: "<username>@gmail.com",
        protocol: "pop3",
        ssl: true
    },
    {
        name: "Outlook (IMAP)",
        host: "imap.live.com",
        port: 993,
        usernameTemplate: "<username>@outlook.com",
        protocol: "imap",
        ssl: true
    },
    {
        name: "Outlook (POP3)",
        host: "pop.live.com",
        port: 995,
        usernameTemplate: "<username>@outlook.com",
        protocol: "pop3",
        ssl: true
    },
    {
        name: "Yahoo (IMAP)",
        host: "imap.mail.yahoo.com",
        port: 993,
        usernameTemplate: "<username>@yahoo.com",
        protocol: "imap",
        ssl: true
    },
    {
        name: "Yahoo (POP3)",
        host: "pop.mail.yahoo.com",
        port: 995,
        usernameTemplate: "<username>@yahoo.com",
        protocol: "pop3",
        ssl: true
    }
];

export const replyHostTypes: HostType[] = [
    {
        name: "Amazon SES EU (Ireland)",
        host: "email-smtp.eu-west-1.amazonaws.com",
        port: 587,
        usernameTemplate: "",
        from: "",
        ssl: true
    },
    {
        name: "Amazon SES US East (N. Virginia)",
        host: "email-smtp.us-east-1.amazonaws.com",
        port: 587,
        usernameTemplate: "",
        from: "",
        ssl: true
    },
    {
        name: "Amazon SES US West (Oregon)",
        host: "email-smtp.us-west-1.amazonaws.com",
        port: 587,
        usernameTemplate: "",
        from: "",
        ssl: true
    },
    {
        name: "Gmail (SSL)",
        host: "stmp.gmail.com",
        port: 465,
        usernameTemplate: "<username>@gmail.com",
        from: "",
        ssl: true
    },
    {
        name: "Gmail (TLS)",
        host: "stmp.gmail.com",
        port: 587,
        usernameTemplate: "<username>@gmail.com",
        from: "",
        ssl: true
    },
    {
        name: "Mailgun (SSL)",
        host: "stmp.mailgun.org",
        port: 465,
        usernameTemplate: "",
        from: "",
        ssl: true
    },
    {
        name: "Mailgun (TLS)",
        host: "stmp.mailgun.org",
        port: 587,
        usernameTemplate: "",
        from: "",
        ssl: true
    },
    {
        name: "Mandrill (SSL)",
        host: "stmp.mandrill.com",
        port: 465,
        usernameTemplate: "",
        from: "",
        ssl: true
    },
    {
        name: "Mandrill (TLS)",
        host: "stmp.mandrill.com",
        port: 587,
        usernameTemplate: "",
        from: "",
        ssl: true
    },
    {
        name: "Outlook (SSL)",
        host: "smtp-mail.outlook.com",
        port: 465,
        usernameTemplate: "<username>@outlook.com",
        from: "",
        ssl: true
    },
    {
        name: "Outlook (TLS)",
        host: "stmp-mail.outlook.com",
        port: 587,
        usernameTemplate: "<username>@outlook.com",
        from: "",
        ssl: true
    },
    {
        name: "Sendgrid (SSL)",
        host: "smtp.sendgrid.net",
        port: 587,
        usernameTemplate: "",
        from: "",
        ssl: true
    },
    {
        name: "Sendgrid (TLS)",
        host: "stmp.sendgrid.net",
        port: 587,
        usernameTemplate: "",
        from: "",
        ssl: true
    },
    {
        name: "Yahoo (SSL)",
        host: "smtp-mail.yahoo.com",
        port: 465,
        usernameTemplate: "<username>@yahoo.com",
        from: "",
        ssl: true
    },
    {
        name: "Yahoo (TLS)",
        host: "stmp.yahoo.com",
        port: 587,
        usernameTemplate: "<username>@yahoo.com",
        from: "",
        ssl: true
    },
];
