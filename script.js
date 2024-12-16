let dateChart = null;

function parseDate(dateString) {
    const parts = dateString.split(' ');
    const dateParts = parts[0].split('.');
    const timeParts = parts[1].split(':');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timeParts[0]}:${timeParts[1]}:00`;
    return new Date(formattedDate);
}

function extractEventDates() {
    const rows = document.querySelectorAll("#events-table tr");
    const eventDates = [];
    rows.forEach(row => {
        const dateCell = row.querySelector(".event-date");
        if (dateCell) {
            const dateText = dateCell.textContent.trim();
            const date = parseDate(dateText);
            if (!isNaN(date.getTime())) {
                eventDates.push(date);
            }
        }
    });
    return eventDates;
}

function formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
}

function groupEventsByTimeframe(timeframe, eventDates) {
    const groupedData = {};
    eventDates.forEach(date => {
        let groupKey;
        switch (timeframe) {
            case "day":
                groupKey = formatDate(date);
                break;
            case "month":
                groupKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                break;
            case "year":
                const currentYear = new Date().getFullYear();
                if (date.getFullYear() >= currentYear - 2 && date.getFullYear() <= currentYear) {
                    groupKey = date.getFullYear();
                } else {
                    return;
                }
                break;
            default:
                groupKey = formatDate(date);
        }
        if (groupKey) {
            if (!groupedData[groupKey]) {
                groupedData[groupKey] = 0;
            }
            groupedData[groupKey]++;
        }
    });
    return groupedData;
}

function updateDateChart(period) {
    const ctx = document.getElementById('date-chart').getContext('2d');
    if (dateChart) {
        dateChart.destroy();
    }
    const eventDates = extractEventDates();
    let groupedDates = groupEventsByTimeframe(period, eventDates);
    const labels = Object.keys(groupedDates);
    const data = Object.values(groupedDates);

    dateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'События безопасности',
                data: data,
                backgroundColor: 'rgba(33, 150, 243, 0.5)',
                borderColor: '#2196f3',
                borderWidth: 2,
                barThickness: 40,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                },
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 50,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

function updateChart() {
    const severityCounts = countSeverity();
    const ctx = document.getElementById('threat-chart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Высокая', 'Средняя', 'Низкая'],
            datasets: [{
                data: [severityCounts['Высокая'], severityCounts['Средняя'], severityCounts['Низкая']],
                backgroundColor: ['#FF0000', '#FFA500', '#32CD32'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function countSeverity() {
    const severityCounts = {
        Высокая: 0,
        Средняя: 0,
        Низкая: 0
    };
    const rows = document.querySelectorAll("#events-table tr");
    rows.forEach(row => {
        const severity = row.cells[3].innerText;
        if (severityCounts[severity] !== undefined) {
            severityCounts[severity]++;
        }
    });
    return severityCounts;
}

async function queryAI(button) {
    const row = button.closest("tr");
    const eventDescription = row.cells[8].innerText;
    const sourceIP = row.cells[6].innerText;
    const severity = row.cells[3].innerText;
    const protocol = row.cells[5].innerText;
    const number = row.cells[0].innerText;

    const data = {
        event: eventDescription,
        source_ip: sourceIP,
        severity: severity,
        protocol: protocol,
        number: number
    };

    const loadingIndicator = document.getElementById("loading-indicator");
    const assistantResultDiv = document.getElementById("assistant-result");
    loadingIndicator.style.display = "block";
    assistantResultDiv.innerHTML = "";

    try {
        const response = await fetch("http://127.0.0.1:8000/analyze_event/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Ошибка запроса!");

        const result = await response.json();

        loadingIndicator.style.display = "none";
        assistantResultDiv.innerHTML = `
            <h3>Результат анализа</h3>
            <p><strong>Сообщение:</strong> ${result.message}</p>
            <p><strong>Ответ:</strong> ${result.response}</p>
        `;
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Ошибка при запросе анализа.");
        loadingIndicator.style.display = "none";
    }
}


function initTimeframeButtons() {
    const buttons = document.querySelectorAll('.time-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function () {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const period = button.dataset.period;
            updateDateChart(period);
        });
    });
    document.querySelector('.time-btn[data-period="day"]').click();
}

window.onload = function () {
    updateChart();
    initTimeframeButtons();
};
