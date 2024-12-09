async function queryAI(button) {
    const row = button.closest("tr");
    const eventDescription = row.cells[7].innerText;
    const sourceIP = row.cells[5].innerText;
    const severity = row.cells[2].innerText;

    const data = {
        event: eventDescription,
        source_ip: sourceIP,
        severity: severity
    };

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
        const assistantResultDiv = document.getElementById("assistant-result");
        assistantResultDiv.innerHTML = `
            <h3>Результат анализа</h3>
            <p><strong>Сообщение:</strong> ${result.message}</p>
            <p><strong>Ответ:</strong> ${result.response}</p>
        `;
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Ошибка при запросе анализа.");
    }
}
