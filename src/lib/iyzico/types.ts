export type IyzicoResponseStatus = "success" | "failure";

export type IyzicoCheckoutInitializeRequest = {
  locale: "tr" | "en";
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: "TRY";
  basketId: string;
  paymentGroup: "PRODUCT";
  callbackUrl: string;
  enabledInstallments?: number[];
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    lastLoginDate?: string;
    registrationDate?: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode?: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: "VIRTUAL";
    price: string;
  }>;
};

export type IyzicoCheckoutInitializeResponse = {
  status: IyzicoResponseStatus;
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  tokenExpireTime?: number;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
};

export type IyzicoCheckoutRetrieveRequest = {
  locale: "tr" | "en";
  conversationId: string;
  token: string;
};

export type IyzicoCheckoutRetrieveResponse = {
  status: IyzicoResponseStatus;
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  token?: string;
  paymentId?: string;
  paymentStatus?: string;
  fraudStatus?: number;
  price?: number;
  paidPrice?: number;
  currency?: string;
  installment?: number;
  basketId?: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
  rawResponse?: unknown;
};
