/**
 * WebBluetooth Printer Service for ESC/POS Thermal Printers
 * Supports: Text printing, Bolding, Alignment, Paper Cutting, Cash Drawer
 */

const ESC = 0x1b;
const GS = 0x1d;

export const PrinterService = {
    device: null,
    characteristic: null,

    // Command sets
    commands: {
        init: new Uint8Array([ESC, 0x40]),
        clean: new Uint8Array([ESC, 0x40]),
        bold_on: new Uint8Array([ESC, 0x45, 0x01]),
        bold_off: new Uint8Array([ESC, 0x45, 0x00]),
        align_left: new Uint8Array([ESC, 0x61, 0x00]),
        align_center: new Uint8Array([ESC, 0x61, 0x01]),
        align_right: new Uint8Array([ESC, 0x61, 0x02]),
        cut: new Uint8Array([GS, 0x56, 0x41, 0x03]), // Full cut
        open_drawer: new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xfa]), // Open drawer via pin 2
        line_feed: new Uint8Array([0x0a]),
    },

    async connect() {
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common for some printers
                    { namePrefix: 'Xprinter' },
                    { namePrefix: 'Printer' },
                    { namePrefix: 'POS' }
                ],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });

            console.log('Connecting to GATT Server...');
            const server = await this.device.gatt.connect();

            console.log('Getting Service...');
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');

            console.log('Getting Characteristic...');
            const characteristics = await service.getCharacteristics();
            // Look for a characteristic that supports 'write'
            this.characteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

            if (!this.characteristic) throw new Error('No writeable characteristic found');

            console.log('Printer connected successfully');
            return this.device.name;
        } catch (error) {
            console.error('Bluetooth connection failed', error);
            throw error;
        }
    },

    async sendRaw(data) {
        if (!this.characteristic) throw new Error('Printer not connected');

        // Chunk data (Bluetooth usually has 20-byte MTU limit for simple writes)
        const chunkSize = 20;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await this.characteristic.writeValue(chunk);
        }
    },

    async printText(text) {
        // Simple encoder for basic Latin characters
        const encoder = new TextEncoder();
        const data = encoder.encode(text + '\n');
        await this.sendRaw(data);
    },

    async printReceipt(store, items, total, meta) {
        if (!this.characteristic) throw new Error('Printer not connected');

        await this.sendRaw(this.commands.init);

        // Header
        await this.sendRaw(this.commands.align_center);
        await this.sendRaw(this.commands.bold_on);
        await this.printText(store.name || 'POS SHOP');
        await this.sendRaw(this.commands.bold_off);
        await this.printText(store.address || '');
        await this.printText('DT: ' + (store.phone || ''));
        await this.sendRaw(this.commands.line_feed);
        await this.sendRaw(this.commands.bold_on);
        await this.printText('   HOA DON BAN HANG   ');
        await this.sendRaw(this.commands.bold_off);
        await this.sendRaw(this.commands.line_feed);
        await this.printText('--------------------------------');

        // Order Info
        await this.sendRaw(this.commands.align_left);
        await this.printText('Ngay: ' + new Date().toLocaleString('vi-VN'));
        await this.printText('Thu ngan: ' + (meta.cashier || 'Admin'));
        await this.printText('--------------------------------');

        // Items
        for (const item of items) {
            await this.printText(`${item.name}`);
            await this.sendRaw(this.commands.align_right);
            await this.printText(`${item.qty} x ${item.price.toLocaleString()} = ${(item.qty * item.price).toLocaleString()}`);
            await this.sendRaw(this.commands.align_left);
        }
        await this.printText('--------------------------------');

        // Total
        await this.sendRaw(this.commands.align_right);
        await this.sendRaw(this.commands.bold_on);
        await this.printText('TONG: ' + total.toLocaleString() + ' d');
        await this.sendRaw(this.commands.bold_off);

        await this.sendRaw(this.commands.align_center);
        await this.printText('\nCam on quy khach!');
        await this.printText('Hen gap lai!\n');
        await this.sendRaw(this.commands.align_center);
        await this.printText('Duoc cung cap boi EPOS Pro');
        await this.printText('0975421439\n\n\n');

        // Kick drawer and cut
        await this.sendRaw(this.commands.open_drawer);
        await this.sendRaw(this.commands.cut);
    },

    async openCashDrawer() {
        await this.sendRaw(this.commands.open_drawer);
    }
};
