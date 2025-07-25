export interface ZaloConfig {
    selfListen?: boolean;
    checkUpdate?: boolean;
    logging?: boolean;
    agent?: any; // Proxy agent
    polyfill?: any; // Polyfill cho fetch
}

export interface ProxyConfig {
    enabled: boolean;
    protocol: 'http' | 'https';
    host: string;
    port: number;
    username?: string;
    password?: string;
}

export interface AccountConfig {
    id: string;
    name: string;
    loginMethod: 'cookie' | 'qr';
    cookie?: any;
    imei?: string;
    userAgent?: string;
    qrPath?: string;
    proxy?: ProxyConfig;
}

export interface BotConfig {
    accounts: AccountConfig[];
    globalProxy?: ProxyConfig;
    selfListen?: boolean;
    checkUpdate?: boolean;
    logging?: boolean;
}

export interface LoginWithCookie {
    cookie: any;
    imei: string;
    userAgent: string;
}

export interface LoginWithQR {
    userAgent?: string;
    qrPath?: string;
}