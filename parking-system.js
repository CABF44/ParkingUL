
const GITHUB_TOKEN = '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';
const OWNER = 'CABF44';
const REPO = 'ParkingUL';
const DATABASE_PATH = 'db/parking.json';


class ParkingSystem {
    constructor() {
        this.baseURL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATABASE_PATH}`;
        this.initializeInterface();
    }

    
    async initializeInterface() {
        await this.updateParkingInfo();
        await this.updateVehiclesList();
        // Actualizar cada 5 minutos
        setInterval(() => {
            this.updateParkingInfo();
            this.updateVehiclesList();
        }, 300000);
    }

    
    async getCurrentData() {
        try {
            const response = await fetch(this.baseURL, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                return { vehicles: [], history: [] };
            }

            const data = await response.json();
            const content = atob(data.content);
            return JSON.parse(content);
        } catch (error) {
            console.error('Error al obtener datos:', error);
            return { vehicles: [], history: [] };
        }
    }

    
    async saveData(data) {
        try {
            
            let sha = '';
            try {
                const currentFile = await fetch(this.baseURL, {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                    }
                });
                if (currentFile.ok) {
                    const fileData = await currentFile.json();
                    sha = fileData.sha;
                }
            } catch (error) {
                
            }

            
            const content = btoa(JSON.stringify(data, null, 2));

            
            const body = {
                message: 'Actualización de datos del parqueadero',
                content,
                ...(sha && { sha }) 
            };

            
            const response = await fetch(this.baseURL, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error('Error al guardar datos');
            }

            return true;
        } catch (error) {
            console.error('Error al guardar datos:', error);
            return false;
        }
    }

    
    async registerEntry(vehicleData) {
        try {
            const currentData = await this.getCurrentData();
            const timestamp = new Date().toISOString();

            // Verificar si el vehículo ya está registrado
            const existingVehicle = currentData.vehicles.find(v => v.plate === vehicleData.plate);
            if (existingVehicle) {
                alert('Este vehículo ya se encuentra registrado en el parqueadero');
                return false;
            }

            const vehicle = {
                ...vehicleData,
                entryTime: timestamp,
                status: 'active'
            };

            currentData.vehicles.push(vehicle);
            currentData.history.push({
                ...vehicle,
                type: 'entry'
            });

            const success = await this.saveData(currentData);
            if (success) {
                await this.updateParkingInfo();
                await this.updateVehiclesList();
                alert('Entrada registrada exitosamente');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al registrar entrada:', error);
            alert('Error al registrar la entrada');
            return false;
        }
    }

    
    async registerExit(plate) {
        try {
            const currentData = await this.getCurrentData();
            const timestamp = new Date().toISOString();

            // Encontrar el vehículo activo
            const vehicleIndex = currentData.vehicles.findIndex(
                v => v.plate === plate && v.status === 'active'
            );

            if (vehicleIndex === -1) {
                alert('Vehículo no encontrado en el parqueadero');
                return false;
            }

            
            const vehicle = currentData.vehicles[vehicleIndex];
            vehicle.exitTime = timestamp;
            vehicle.status = 'inactive';

            
            currentData.history.push({
                ...vehicle,
                type: 'exit'
            });

            
            currentData.vehicles.splice(vehicleIndex, 1);

            const success = await this.saveData(currentData);
            if (success) {
                await this.updateParkingInfo();
                await this.updateVehiclesList();
                alert('Salida registrada exitosamente');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al registrar salida:', error);
            alert('Error al registrar la salida');
            return false;
        }
    }

    
    async updateParkingInfo() {
        const data = await this.getCurrentData();
        const availableSpaces = document.getElementById('available-spaces');
        const parkedVehicles = document.getElementById('parked-vehicles');
        
        if (availableSpaces && parkedVehicles) {
            const total = 150; 
            const current = data.vehicles.length;
            availableSpaces.textContent = total - current;
            parkedVehicles.textContent = current;
        }
    }

    
    async updateVehiclesList() {
        const data = await this.getCurrentData();
        const vehiclesList = document.getElementById('vehicles-list');
        
        if (vehiclesList) {
            vehiclesList.innerHTML = data.vehicles.map(vehicle => `
                <tr>
                    <td>${vehicle.plate}</td>
                    <td>${vehicle.type === 'car' ? 'Carro' : 'Moto'}</td>
                    <td>${vehicle.zone}</td>
                    <td>${new Date(vehicle.entryTime).toLocaleString()}</td>
                </tr>
            `).join('');
        }
    }

    
    async getCurrentVehicles() {
        const data = await this.getCurrentData();
        return data.vehicles;
    }

    
    async getHistory() {
        const data = await this.getCurrentData();
        return data.history;
    }
}


const parkingSystem = new ParkingSystem();


async function handleVehicleEntry() {
    const plate = document.getElementById('plate').value;
    const type = document.getElementById('vehicle-type').value;
    const zone = document.getElementById('zone').value;

    if (!plate || !type || !zone) {
        alert('Por favor complete todos los campos');
        return;
    }

    const vehicleData = { plate, type, zone };
    const success = await parkingSystem.registerEntry(vehicleData);
    
    if (success) {
        
        document.getElementById('plate').value = '';
        document.getElementById('vehicle-type').value = '';
        document.getElementById('zone').value = '';
    }
}


async function handleVehicleExit() {
    const plate = document.getElementById('exit-plate').value;

    if (!plate) {
        alert('Por favor ingrese la placa del vehículo');
        return;
    }

    const success = await parkingSystem.registerExit(plate);
    
    if (success) {
        
        document.getElementById('exit-plate').value = '';
    }
}
