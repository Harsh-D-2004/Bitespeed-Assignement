export type IdentifyInput = {
    email: string;
    phoneNumber: string;
};

export type ContactResponse = {
    contact: {
        primaryContactId: number;
        emails: string[];
        phoneNumbers: string[];
        secondaryContactIds: number[];
    };
};