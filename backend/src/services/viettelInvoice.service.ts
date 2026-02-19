import axios from 'axios';
import 'dotenv/config';

interface ViettelConfig {
    baseUrl: string;
    username?: string;
    password?: string;
    taxCode?: string;
}

interface InvoiceItem {
    name: string;
    unit: string;
    quantity: number;
    price: number;
    amount: number;
    taxRateName: string; // '1%', '8%', '10%', 'KCT'
}

class ViettelInvoiceService {
    private config: ViettelConfig;
    private token: string | null = null;
    private tokenExpiry: number = 0;

    constructor() {
        this.config = {
            baseUrl: process.env.VIETTEL_API_URL || 'https://sinvoice.viettel.vn/api', // PROD URL
            username: process.env.VIETTEL_USERNAME,
            password: process.env.VIETTEL_PASSWORD,
            taxCode: process.env.VIETTEL_TAX_CODE
        };
    }

    /**
     * Authenticate and get Access Token
     * Caches token to avoid frequent logins
     */
    private async getViettelToken(): Promise<string> {
        const now = Date.now();
        // Return cached token if valid (with 5 min buffer)
        if (this.token && this.tokenExpiry > now + 5 * 60 * 1000) {
            return this.token;
        }

        try {
            const response = await axios.post(`${this.config.baseUrl}/auth/login`, {
                username: this.config.username,
                password: this.config.password
            });

            if (response.data && response.data.access_token) {
                this.token = response.data.access_token;
                // Token valid for X seconds (default usually 1 day or similar)
                // We'll set a safe expiry or parse from response if available
                this.tokenExpiry = now + (response.data.expires_in || 24 * 3600) * 1000;
                return this.token as string;
            } else {
                throw new Error('Login failed: No access token received');
            }
        } catch (error: any) {
            console.error('Viettel Auth Error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Viettel S-Invoice');
        }
    }

    /**
     * Map Order to Viettel Invoice JSON format
     * Specifically tailored for "Máy tính tiền" (Cash Register)
     */
    private mapOrderToViettelFormat(orderData: any): any {
        // Items Mapping
        const items = orderData.items.map((item: any) => ({
            lineNumber: item.index || 1,
            itemName: item.name,
            unitName: item.unit || 'Cái',
            quantity: item.quantity,
            price: item.price,
            amount: item.amount, // Ensure this equals quantity * price
            taxRateName: '1%',   // Default for Household Business (Revenue Tax)
            taxAmount: Math.round(item.amount * 0.01), // Calculate 1% tax amount
            itemTotalAmountWithoutTax: item.amount,
            isIncrease: false // Normal item
        }));

        // Total Calculations
        const totalAmount = items.reduce((sum: number, i: any) => sum + i.amount, 0);
        const totalTax = items.reduce((sum: number, i: any) => sum + i.taxAmount, 0);

        return {
            generalInvoiceInfo: {
                invoiceType: "1", // 1: GTGT, 2: Ban Hang. Check contract. Usually 1 for declared method.
                templateCode: process.env.VIETTEL_TEMPLATE_CODE, // e.g., 1/001
                invoiceSeries: process.env.VIETTEL_INVOICE_SERIES, // e.g., K26TBM (M for Machine)
                currencyCode: "VND",
                adjustmentType: "1", // 1: Original, 3: Replacement, etc.
                paymentMethod: "TM/CK", // Cash/Transfer
                paymentStatus: true,
                cusGetInvoiceRight: true,
                transactionUuid: orderData.transactionCode // Unique ID from POS to prevent duplicates
            },
            buyerInfo: {
                buyerName: orderData.customer?.name || "Khách lẻ",
                buyerTaxCode: orderData.customer?.taxCode || "",
                buyerAddress: orderData.customer?.address || "",
                buyerPhoneNumber: orderData.customer?.phone || "",
                buyerEmail: orderData.customer?.email || "" // Required for sending email
            },
            sellerInfo: {
                sellerTaxCode: this.config.taxCode,
                sellerAddress: process.env.VIETTEL_STORE_ADDRESS,
                sellerPhoneNumber: process.env.VIETTEL_STORE_PHONE,
                sellerEmail: process.env.VIETTEL_STORE_EMAIL
            },
            payments: [{ paymentMethodName: "Tiền mặt", paymentAmount: totalAmount + totalTax }],
            itemInfo: items,
            summarizeInfo: {
                sumOfTotalLineAmountWithoutTax: totalAmount,
                totalAmountWithoutTax: totalAmount,
                totalTaxAmount: totalTax,
                totalAmountWithTax: totalAmount + totalTax,
                totalAmountWithTaxInWords: orderData.totalAmountInWords || "",
                discountAmount: orderData.discount || 0,
                settlementDiscountAmount: 0 // CK thanh toan
            },
            taxBreakdowns: [{
                taxRateName: "1%",
                taxableAmount: totalAmount,
                taxAmount: totalTax
            }]
        };
    }

    /**
     * Create and Publish Invoice ("Lập và Phát hành hóa đơn")
     * Returns the CQT Code and Invoice Number
     */
    public async createAndPublishInvoice(orderData: any): Promise<any> {
        const token = await this.getViettelToken();
        const invoiceBody = this.mapOrderToViettelFormat(orderData);

        try {
            // Using the endpoint for "Create and Issue" (Lập hóa đơn nháp và phát hành ngay)
            // Or typically /invoice-representation/create for standard flow
            // For Machine Invoices, endpoints might differ. Assuming standard V2:

            const endpoint = `${this.config.baseUrl}/invoice/create`;

            const response = await axios.post(endpoint, invoiceBody, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.errorCode) {
                // Determine if successful (errorCode usually null or specific success code)
                // Viettel sometimes returns 200 even on logical error, check body
                throw new Error(`Viettel API Error: ${response.data.description}`);
            }

            // Standard success response contains: invoiceNo, reservationCode (CQT Code), etc.
            // Adjust based on actual response structure
            return {
                success: true,
                viettelId: response.data.result?.invoiceId,
                invoiceNumber: response.data.result?.invoiceNo,
                cqtCode: response.data.result?.reservationCode || 'CQT_PENDING', // CQT Code
                publishDate: new Date()
            };

        } catch (error: any) {
            // Log full error for debugging
            console.error('Viettel Create Invoice Failed:', error.response?.data || error.message);

            // Return standardized error object for Frontend
            return {
                success: false,
                error: 'FAILED_TO_ISSUE_INVOICE',
                message: error.response?.data?.description || error.message,
                originalOrder: orderData.transactionCode
            };
        }
    }

    /**
     * Remote Signing for Tax Reports
     * This simulates connecting to Viettel's HSM/Remote Signing service
     */
    public async signReport(reportData: any): Promise<any> {
        // In a real scenario, this would:
        // 1. Calculate the hash of the report XML/Content
        // 2. Call Viettel Remote Signing API (e.g., /signing/remote)
        // 3. Receive the signed hash and certificate info

        // Simulating delay for security handshake
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mocking successful response from HSM
        return {
            success: true,
            signerName: process.env.SIGNER_NAME || "NGUYỄN VĂN A",
            signatureValue: "MIIE7AYJKoZIhvcNAQcCoIIE3TCCBNkCAQExCzAJBgUrDgMCGgUAMAsGCSqGSIb3DQEHAaCC...",
            certSerial: "5404-2024-1234-5678-ABCD",
            timestamp: new Date().toISOString()
        };
    }
}

export default new ViettelInvoiceService();
