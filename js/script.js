let currentZone = null;

const FILAS = 5;
const COLUMNAS = 10;
const ZONAS = ['A', 'B', 'C'];
let espaciosDisponibles = 150;
let vehiculosEstacionados = 0;
let vehiculosMap = new Map();


function initializeZones() {
    const parkingZones = document.getElementById('parking-zones');
    
    ZONAS.forEach(zona => {
        const zoneContainer = document.createElement('div');
        zoneContainer.id = `zona-${zona}`;
        zoneContainer.className = 'zone-container';
        zoneContainer.style.display = 'none';

        const headerContainer = document.createElement('div');
        headerContainer.className = 'header-container';
        
        const backButton = document.createElement('button');
        backButton.className = 'back-btn';
        backButton.textContent = 'Volver al Mapa';
        backButton.onclick = showMainMenu;
        headerContainer.appendChild(backButton);
        zoneContainer.appendChild(headerContainer);

        const contentContainer = document.createElement('div');
        contentContainer.className = 'content-container';

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const zoneImage = document.createElement('div');
        zoneImage.className = 'zone-image';
        zoneImage.style.backgroundImage = `url('imagenes/zona${zona.toLowerCase()}.png')`;

        let isZoomed = false;
        zoneImage.addEventListener('click', () => {
            isZoomed = !isZoomed;
            if(isZoomed) {
                zoneImage.classList.add('zoomed');
            } else {
                zoneImage.classList.remove('zoomed');
            }
        });


        contentContainer.appendChild(zoneImage);
        contentContainer.appendChild(imageContainer);


        const grid = document.createElement('div');
        grid.className = 'parking-grid';
        
        for (let i = 0; i < FILAS * COLUMNAS; i++) {
            const space = document.createElement('button');
            space.className = 'parking-space';
            const spaceNumber = `${zona}${String(i + 1).padStart(2, '0')}`;
            space.textContent = spaceNumber;
            space.onclick = () => handleSpaceClick(space, spaceNumber);
            grid.appendChild(space);
        }

        contentContainer.appendChild(grid);
        zoneContainer.appendChild(contentContainer);
        parkingZones.appendChild(zoneContainer);
    });
}

        function showZone(zona) {
            let transitionElement = document.querySelector('.map-transition');
            if (!transitionElement) {
                transitionElement = document.createElement('div');
                transitionElement.className = 'map-transition';
                document.body.appendChild(transitionElement);
            }

            const button = document.getElementById(`zona-btn-${zona}`);
            const buttonRect = button.getBoundingClientRect();
            const centerX = buttonRect.left + buttonRect.width / 2;
            const centerY = buttonRect.top + buttonRect.height / 2;

            const mapImage = document.createElement('img');
            mapImage.src = 'imagenes/mapa-parqueadero.png';
            transitionElement.innerHTML = '';
            transitionElement.appendChild(mapImage);

            
            
            requestAnimationFrame(() => {
                transitionElement.classList.add('active');
                
                setTimeout(() => {
                    transitionElement.classList.add('zooming');
                    
                    setTimeout(() => {
                        mapImage.src = `imagenes/zona${zona.toLowerCase()}.png`;
                        
                        setTimeout(() => {
                            document.getElementById('map-container').style.display = 'none';
                            

                            const zoneView = document.getElementById('zone-view');
                            zoneView.style.display = 'block';
                            
                            const zoneElement = document.getElementById(`zona-${zona}`);
                            zoneElement.style.display = 'block';
                            
                            zoneElement.querySelector('.parking-grid').style.display = 'grid';
                            
                            setTimeout(() => {
                                zoneElement.classList.add('visible');
                            }, 50);
        
                            transitionElement.classList.remove('active', 'zooming');
                        }, 500);
                    }, 300);
                }, 50);
            });
        
            currentZone = zona;
        }
        

        function showMainMenu() {
            document.getElementById('map-container').style.display = 'block';
            document.getElementById('zone-view').style.display = 'none';
            ZONAS.forEach(zona => {
                document.getElementById(`zona-${zona}`).style.display = 'none';
            });
        }

        function handleSpaceClick(spaceElement, spaceNumber) {
            if (!spaceElement.classList.contains('occupied')) {
                const placa = prompt('Ingrese la placa del vehículo (Formato: ABC123):');
                if (placa && validatePlate(placa)) {
                    spaceElement.classList.add('occupied');
                    spaceElement.innerHTML = `${spaceNumber}<br>${placa}`;
                    espaciosDisponibles--;
                    vehiculosEstacionados++;
                    vehiculosMap.set(placa, {
                        placa,
                        numero: spaceNumber,
                        tiempoEntrada: Date.now(),
                        elemento: spaceElement
                    });
                    updateInfo();
                } else if (placa) {
                    alert('Formato de placa inválido. Debe ser tres letras seguidas de tres números.');
                }
            } else {
                const placa = spaceElement.innerHTML.split('<br>')[1];
                const vehiculo = vehiculosMap.get(placa);
                if (vehiculo) {
                    const tiempoEstacionado = Math.floor((Date.now() - vehiculo.tiempoEntrada) / 60000);
                    const costo = calcularCosto(tiempoEstacionado);
                    alert(`Placa: ${placa}\nTiempo estacionado: ${tiempoEstacionado} minutos\nCosto: $${costo}`);
                    
                    spaceElement.classList.remove('occupied');
                    spaceElement.textContent = spaceNumber;
                    vehiculosMap.delete(placa);
                    espaciosDisponibles++;
                    vehiculosEstacionados--;
                    updateInfo();
                }
            }
        }

        function validatePlate(placa) {
            return /^[A-Z]{3}\d{3}$/.test(placa);
        }

        function calcularCosto(tiempoEnMinutos) {
            return 2000 + (tiempoEnMinutos - 1) * 1000;
        }

        function updateInfo() {
            document.getElementById('espacios-disponibles').textContent = `Espacios disponibles: ${espaciosDisponibles}`;
            document.getElementById('vehiculos-estacionados').textContent = `Vehículos estacionados: ${vehiculosEstacionados}`;
        }

        function generateReport() {
            let informe = "Informe del Parqueadero\n\n";
            informe += `Espacios totales: 150\n`;
            informe += `Espacios disponibles: ${espaciosDisponibles}\n`;
            informe += `Vehículos estacionados: ${vehiculosEstacionados}\n`;
            informe += `Ocupación: ${((vehiculosEstacionados / 150) * 100).toFixed(2)}%\n\n`;

            informe += "Detalle de vehículos estacionados:\n";
            vehiculosMap.forEach((vehiculo, placa) => {
                const tiempoEstacionado = Math.floor((Date.now() - vehiculo.tiempoEntrada) / 60000);
                const costo = calcularCosto(tiempoEstacionado);
                informe += `Placa: ${placa}, Espacio: ${vehiculo.numero}, `;
                informe += `Tiempo: ${tiempoEstacionado} minutos, Costo actual: $${costo}\n`;
            });

            alert(informe);
        }

        setInterval(() => {
            vehiculosMap.forEach((vehiculo, placa) => {
                const tiempoEstacionado = Math.floor((Date.now() - vehiculo.tiempoEntrada) / 60000);
                const costo = calcularCosto(tiempoEstacionado);
                vehiculo.elemento.innerHTML = `${vehiculo.numero}<br>${placa}<br>$${costo}`;
            });
        }, 60000);

        initializeZones();