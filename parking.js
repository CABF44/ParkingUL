// Configuración de Firebase - REEMPLAZA CON TUS CREDENCIALES
const firebaseConfig = {
    apiKey: "AIzaSyDvggZE9UBpXaFUgesSM2GhdQnG0sWW8Pc",
    authDomain: "parkingul.firebaseapp.com",
    projectId: "parkingul",
    storageBucket: "parkingul.firebasestorage.app",
    messagingSenderId: "286538744008",
    appId: "1:286538744008:web:e858c649ef2ce573daa5fd"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

class ParkingSystem {
    constructor() {
        this.initializeListeners();
        this.updateCounter();
    }

    // Inicializar los event listeners
    initializeListeners() {
        // Event listeners para las zonas de parqueo
        const zones = document.querySelectorAll('.parking-zone');
        zones.forEach(zone => {
            zone.addEventListener('click', () => this.handleZoneClick(zone));
        });

        // Event listener para el botón de reporte
        document.getElementById('generateReport').addEventListener('click', () => this.generateReport());
    }

    // Manejar clic en una zona
    async handleZoneClick(zoneElement) {
        const zone = zoneElement.dataset.zone;
        const action = await this.showActionDialog();
        
        if (action === 'entry') {
            const plate = await this.showPlateDialog('entrada');
            if (plate) {
                await this.registerEntry(plate, zone);
            }
        } else if (action === 'exit') {
            const plate = await this.showPlateDialog('salida');
            if (plate) {
                await this.registerExit(plate, zone);
            }
        }
    }

    // Mostrar diálogo para seleccionar acción
    showActionDialog() {
        return new Promise((resolve) => {
            const action = prompt('¿Qué desea registrar? (entrada/salida):').toLowerCase();
            if (action === 'entrada') resolve('entry');
            else if (action === 'salida') resolve('exit');
            else resolve(null);
        });
    }

    // Mostrar diálogo para ingresar placa
    showPlateDialog(type) {
        return new Promise((resolve) => {
            const plate = prompt(`Ingrese la placa del vehículo para ${type}:`);
            resolve(plate ? plate.toUpperCase() : null);
        });
    }

    // Registrar entrada de vehículo
    async registerEntry(plate, zone) {
        try {
            // Verificar si el vehículo ya está en el parqueadero
            const existingVehicle = await this.findActiveVehicle(plate);
            if (existingVehicle) {
                alert('Este vehículo ya se encuentra en el parqueadero');
                return;
            }

            // Crear registro del vehículo
            const vehicleData = {
                plate,
                zone,
                entryTime: new Date(),
                status: 'active'
            };

            // Guardar en la colección de vehículos activos
            await db.collection('vehicles').add(vehicleData);

            // Guardar en el historial
            await db.collection('history').add({
                ...vehicleData,
                type: 'entry'
            });

            alert('Entrada registrada exitosamente');
            this.updateCounter();
        } catch (error) {
            console.error('Error al registrar entrada:', error);
            alert('Error al registrar la entrada');
        }
    }

    // Registrar salida de vehículo
    async registerExit(plate, zone) {
        try {
            const vehicle = await this.findActiveVehicle(plate);
            if (!vehicle) {
                alert('Vehículo no encontrado en el parqueadero');
                return;
            }

            // Actualizar estado del vehículo
            await db.collection('vehicles').doc(vehicle.id).update({
                status: 'inactive',
                exitTime: new Date()
            });

            // Registrar en historial
            await db.collection('history').add({
                plate,
                zone,
                exitTime: new Date(),
                type: 'exit'
            });

            alert('Salida registrada exitosamente');
            this.updateCounter();
        } catch (error) {
            console.error('Error al registrar salida:', error);
            alert('Error al registrar la salida');
        }
    }

    // Buscar vehículo activo por placa
    async findActiveVehicle(plate) {
        const snapshot = await db.collection('vehicles')
            .where('plate', '==', plate)
            .where('status', '==', 'active')
            .get();

        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }

    // Actualizar contador de vehículos
    async updateCounter() {
        try {
            const snapshot = await db.collection('vehicles')
                .where('status', '==', 'active')
                .get();

            const count = snapshot.size;
            document.getElementById('available-spaces').textContent = 150 - count;
            document.getElementById('parked-vehicles').textContent = count;
        } catch (error) {
            console.error('Error al actualizar contador:', error);
        }
    }

    // Generar reporte
    async generateReport() {
        try {
            const snapshot = await db.collection('vehicles')
                .where('status', '==', 'active')
                .get();

            let report = 'REPORTE DE VEHÍCULOS ACTUALES\n\n';
            snapshot.forEach(doc => {
                const data = doc.data();
                report += `Placa: ${data.plate}\n`;
                report += `Zona: ${data.zone}\n`;
                report += `Entrada: ${data.entryTime.toDate().toLocaleString()}\n\n`;
            });

            console.log(report);
            alert('Reporte generado en la consola');
        } catch (error) {
            console.error('Error al generar reporte:', error);
            alert('Error al generar el reporte');
        }
    }
}

// Inicializar el sistema cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ParkingSystem();
});
