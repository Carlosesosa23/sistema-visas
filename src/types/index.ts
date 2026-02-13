export type ClientStatus = 'pending' | 'ds160' | 'paid' | 'cas_appointment' | 'consulate_appointment' | 'approved' | 'rejected' | 'delivered';

export interface Client {
    id: string;
    firstName: string;
    lastName: string;
    passportNumber: string;
    phone: string;
    email: string;
    status: ClientStatus;
    notes: string;
    appointmentCas?: string; // ISO date string
    appointmentConsulate?: string; // ISO date string
    appointmentDate?: string; // General appointment date from Excel
    appointmentTime?: string; // Appointment time
    dsApplicationId?: string; // DS-160 Application ID
    password?: string; // User account password
    passportPhotoUrl?: string; // URL for passport photo
    ds160Url?: string; // URL for DS-160 PDF
    appointmentConfirmationUrl?: string; // URL for appointment confirmation PDF
    tags?: string[];
    createdAt: string;
    rawExcelData?: Record<string, any>;
}
