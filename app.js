
let salesData = [];
let detectedInventory = [];
let selectedShelfFile = null;


// =====================================
// PRODUCT NAME MATCHING
// =====================================

function canonicalProductName(name) {
    const product = String(name || "")
        .toLowerCase()
        .trim();

    if (
        product === "noodles" ||
        product === "maggi noodles"
    ) {
        return "maggi";
    }

    if (product === "nescafes") {
        return "nescafe";
    }

    return product;
}


function productNamesMatch(name1, name2) {
    return (
        canonicalProductName(name1) ===
        canonicalProductName(name2)
    );
}


function questionMatchesProduct(question, productName) {
    const product = String(productName || "")
        .toLowerCase()
        .trim();

    const canonical = canonicalProductName(productName);

    if (product && question.includes(product)) {
        return true;
    }

    if (
        canonical === "maggi" &&
        (
            question.includes("maggi") ||
            question.includes("noodles")
        )
    ) {
        return true;
    }

    if (
        canonical === "nescafe" &&
        (
            question.includes("nescafe") ||
            question.includes("nescafes")
        )
    ) {
        return true;
    }

    return false;
}


function capitalize(text) {
    const value = String(text || "");

    return value.charAt(0).toUpperCase() +
        value.slice(1);
}


// =====================================
// PAGE LOAD
// =====================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("DukaanMitra AI loaded successfully!");

    loadSalesAnalysis();
    loadExpiryAnalysis();

    initializeShelfScanner();
    initializeExpiryScanner();
    initializeChatAssistant();
});


// =====================================
// SHELF SCANNER
// =====================================

function initializeShelfScanner() {

    const scanButton =
        document.getElementById("scanButton");

    const imageInput =
        document.getElementById("imageInput");

    const shelfImage =
        document.getElementById("shelfImage");

    const scanStatus =
        document.getElementById("scanStatus");


    if (!scanButton || !imageInput) {
        console.warn(
            "Shelf scanner: scanButton or imageInput not found."
        );
        return;
    }


    // Open photo selector when the scan button is clicked.
    // After selecting a photo, the next click starts scanning.

    scanButton.addEventListener("click", async function () {

        if (!selectedShelfFile) {
            imageInput.click();
            return;
        }

        scanButton.disabled = true;
        scanButton.innerText = "⏳ AI analyzing...";

        if (scanStatus) {
            scanStatus.innerText =
                "🤖 AI आपकी shelf को analyze कर रहा है...";
        }

        const formData = new FormData();

        formData.append("image", selectedShelfFile);

        try {

            const response = await fetch("/upload-shelf", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Shelf scan failed."
                );
            }

            console.log("YOLO results:", data.detections);

            displayDetections(data.detections || []);

            if (scanStatus) {
                scanStatus.innerText =
                    "✅ Shelf analysis complete!";
            }

            selectedShelfFile = null;
            imageInput.value = "";

            scanButton.innerText =
                "📸 दूसरी Shelf Scan करें";

        } catch (error) {

            console.error("Shelf scan error:", error);

            if (scanStatus) {
                scanStatus.innerText =
                    "❌ " + error.message;
            }

            scanButton.innerText =
                "🔄 Try Again";

        } finally {
            scanButton.disabled = false;
        }
    });


    // Select a shelf photo and display its preview.

    imageInput.addEventListener("change", function () {

        const file = this.files && this.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            if (scanStatus) {
                scanStatus.innerText =
                    "⚠️ कृपया image file चुनें।";
            }

            selectedShelfFile = null;
            imageInput.value = "";

            return;
        }

        selectedShelfFile = file;

        console.log("Selected shelf image:", file.name);

        if (shelfImage) {
            shelfImage.src = URL.createObjectURL(file);
            shelfImage.style.display = "block";
        }

        if (scanStatus) {
            scanStatus.innerText =
                "✅ फोटो चुन ली गई है। अब AI Scan करें।";
        }

        scanButton.innerText = "🔍 AI से Scan करें";
    });
}


// =====================================
// DISPLAY SHELF DETECTIONS
// =====================================

function displayDetections(detections) {

    detectedInventory = [];

    const resultsContainer =
        document.getElementById("detectedProducts");

    const detectedCount =
        document.getElementById("objectsDetected");

    const uniqueCount =
        document.getElementById("typesFound");

    const lowStockElement =
    document.getElementById("lowStock");


    if (!resultsContainer) {
        console.warn("detectedProducts element not found.");
        return;
    }


    if (!Array.isArray(detections) || detections.length === 0) {

        if (detectedCount) {
            detectedCount.innerText = "0";
        }

        if (uniqueCount) {
            uniqueCount.innerText = "0";
        }

        resultsContainer.innerHTML = `
            <div class="empty-analysis">
                <div class="empty-icon">🔎</div>
                <h3>कोई object detect नहीं हुआ</h3>
                <p>
                    बेहतर lighting और clear shelf photo
                    के साथ फिर से try करें।
                </p>
            </div>
        `;

        return;
    }


    const objectTypes = {};

    detections.forEach(function (item) {

        const name = String(item.product || "Unknown");

        if (!objectTypes[name]) {
            objectTypes[name] = [];
        }

        objectTypes[name].push(item);
    });


    // Save inventory for chatbot stock lookup.

    detectedInventory = Object.keys(objectTypes).map(
        function (name) {
            return {
                product: name,
                count: objectTypes[name].length
            };
        }
    );
    if (lowStockElement) {
    const lowStockCount = detectedInventory.filter(
        function (item) {
            const salesItem = salesData.find(function (sale) {
                return productNamesMatch(
                    sale.product,
                    item.product
                );
            });

            if (!salesItem) {
                return item.count <= 2;
            }

            const recommendedStock =
                Number(salesItem.recommended_stock);

            return Number.isFinite(recommendedStock) &&
                   recommendedStock > 0 &&
                   item.count < recommendedStock;
        }
    ).length;

    lowStockElement.innerText = lowStockCount;
}


    if (detectedCount) {
        detectedCount.innerText = detections.length;
    }

    if (uniqueCount) {
        uniqueCount.innerText =
            Object.keys(objectTypes).length;
    }


    resultsContainer.innerHTML = "";


    Object.keys(objectTypes).forEach(function (name) {

        const items = objectTypes[name];
        const count = items.length;


        const salesItem = salesData.find(function (item) {
            return productNamesMatch(item.product, name);
        });


        let highestConfidence = 0;

        items.forEach(function (item) {

            let confidence = Number(item.confidence) || 0;

            // Support confidence represented as either 0–1 or 0–100.

            if (confidence > 1 && confidence <= 100) {
                // Already a percentage.
            } else if (confidence >= 0 && confidence <= 1) {
                confidence *= 100;
            }

            if (confidence > highestConfidence) {
                highestConfidence = confidence;
            }
        });


        const confidencePercent =
            Math.round(highestConfidence);


        const card = document.createElement("div");

        card.className = "detection-card";

        card.innerHTML = `
            <div class="detection-product-icon">📦</div>

            <div class="detection-product-info">

                <h3>${capitalize(name)}</h3>

                <p>
                    ${count}
                    object${count !== 1 ? "s" : ""}
                    detected
                </p>

                ${
                    salesItem
                        ? `
                            <p>
                                Average daily demand:
                                <strong>
                                    ${salesItem.average_daily_demand ?? "N/A"}
                                </strong>
                                units
                            </p>

                            <p>
                                🤖 AI predicted daily demand:
                                <strong>
                                    ${salesItem.predicted_daily_demand ?? "N/A"}
                                </strong>
                                units
                            </p>

                            <p>
                                Recommended stock:
                                <strong>
                                    ${salesItem.recommended_stock ?? "N/A"}
                                </strong>
                                units
                            </p>

                            <p>
                                ⏳ Stock lasts:
                                <strong>
                                    ${
                                        Number(salesItem.predicted_daily_demand) > 0
                                            ? (
                                                count /
                                                Number(salesItem.predicted_daily_demand)
                                            ).toFixed(1)
                                            : "N/A"
                                    }
                                </strong>
                                days
                            </p>

                            <p>
                                ${
                                    Number.isFinite(
                                        Number(salesItem.recommended_stock)
                                    )
                                    ? (
                                        count <
                                        Number(salesItem.recommended_stock)
                                            ? `🔴 Restock ${
                                                Number(salesItem.recommended_stock) -
                                                count
                                            } units`
                                            : "🟢 Stock level looks good"
                                    )
                                    : ""
                                }
                            </p>
                        `
                        : ""
                }

            </div>

            <div class="detection-confidence">
                <strong>${confidencePercent}%</strong>
                <span>confidence</span>
            </div>
        `;

        resultsContainer.appendChild(card);
    });
}


// =====================================
// SALES ANALYSIS
// =====================================

async function loadSalesAnalysis() {

    try {

        const response = await fetch("/sales-analysis");

        if (!response.ok) {
            throw new Error("Sales analysis request failed.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Unexpected sales analysis response.");
        }

        salesData = data;

        console.log("Sales Analysis:", data);


        const salesResults =
            document.getElementById("salesResults");

        if (!salesResults) {
            return;
        }

        salesResults.innerHTML = "";


        data.forEach(function (item) {

            const card = document.createElement("div");

            card.className = "sales-card";

            card.innerHTML = `
                <h3>${capitalize(item.product)}</h3>

                <p>
                    Average daily demand:
                    <strong>
                        ${item.average_daily_demand ?? "N/A"}
                    </strong>
                    units
                </p>

                <p>
                    🤖 AI predicted daily demand:
                    <strong>
                        ${item.predicted_daily_demand ?? "N/A"}
                    </strong>
                    units
                </p>

                <p>
                    Recommended stock:
                    <strong>
                        ${item.recommended_stock ?? "N/A"}
                    </strong>
                    units
                </p>

                <p>
                    Demand trend:
                    <strong>
                        ${
                            item.trend === "Increasing"
                                ? "📈 Increasing"
                                : item.trend === "Decreasing"
                                    ? "📉 Decreasing"
                                    : "➡️ Stable"
                        }
                    </strong>
                </p>
            `;

            salesResults.appendChild(card);
        });

    } catch (error) {

        console.error("Sales analysis error:", error);
    }
}


// =====================================
// EXPIRY ANALYSIS
// =====================================

async function loadExpiryAnalysis() {

    try {

        const response = await fetch("/expiry-analysis");

        if (!response.ok) {
            throw new Error("Expiry analysis request failed.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Unexpected expiry analysis response.");
        }

        console.log("Expiry Analysis:", data);


        const expiryResults =
            document.getElementById("expiryResults");

        const expiringSoon =
            document.getElementById("expiringSoon");


        if (!expiryResults) {
            return;
        }

        expiryResults.innerHTML = "";

        let expiringCount = 0;


        data.forEach(function (item) {

            let statusIcon = "🟢";
            let statusClass = "safe";


            if (item.status === "Expiring Soon") {

                statusIcon = "🟡";
                statusClass = "expiring";

                expiringCount++;
            }


            if (item.status === "Expired") {

                statusIcon = "🔴";
                statusClass = "expired";
            }


            const card = document.createElement("div");

            card.className =
                "expiry-card " + statusClass;

            card.innerHTML = `
                <div class="expiry-card-header">

                    <h3>
                        ${statusIcon}
                        ${capitalize(item.product)}
                    </h3>

                    <span class="expiry-status">
                        ${item.status ?? "Unknown"}
                    </span>

                </div>

                <div class="expiry-details">

                    <div>
                        <span>Expiry Date</span>
                        <strong>
                            ${item.expiry_date ?? "N/A"}
                        </strong>
                    </div>

                    <div>
                        <span>Quantity</span>
                        <strong>
                            ${item.quantity ?? "N/A"} units
                        </strong>
                    </div>

                    <div>
                        <span>Days Left</span>
                        <strong>
                            ${item.days_left ?? "N/A"}
                        </strong>
                    </div>

                </div>
            `;

            expiryResults.appendChild(card);
        });


        if (expiringSoon) {
            expiringSoon.innerText = expiringCount;
        }

    } catch (error) {

        console.error("Expiry analysis error:", error);
    }
}


// =====================================
// EXPIRY OCR SCANNER
// =====================================

function initializeExpiryScanner() {

    const expiryScanButton =
        document.getElementById("expiryScanButton");

    const expiryImageInput =
        document.getElementById("expiryImageInput");

    const expiryScanStatus =
        document.getElementById("expiryScanStatus");


    if (!expiryScanButton || !expiryImageInput) {
        console.warn(
            "Expiry scanner button or image input not found."
        );
        return;
    }


    expiryScanButton.addEventListener("click", function () {
        expiryImageInput.click();
    });


    expiryImageInput.addEventListener(
        "change",
        async function () {

            const file = this.files && this.files[0];

            if (!file) {
                return;
            }

            if (!file.type.startsWith("image/")) {

                if (expiryScanStatus) {
                    expiryScanStatus.innerText =
                        "⚠️ कृपया product की image चुनें।";
                }

                expiryImageInput.value = "";
                return;
            }


            expiryScanButton.disabled = true;

            expiryScanButton.innerText =
                "⏳ Reading Expiry...";

            if (expiryScanStatus) {
                expiryScanStatus.innerText =
                    "🤖 AI expiry date पढ़ रहा है...";
            }


            const formData = new FormData();

            formData.append("image", file);


            try {

                const response = await fetch("/ocr-expiry", {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();


                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Expiry scan failed."
                    );
                }


                if (data.expiry_date) {

                    const statusText =
                        data.status === "Expired"
                            ? "🔴 Expired"
                            : data.status === "Expiring Soon"
                                ? "🟡 Expiring Soon"
                                : "🟢 Safe";

                    if (expiryScanStatus) {

                        expiryScanStatus.innerHTML = `
                            📅 Expiry Date:
                            <strong>${data.expiry_date}</strong>

                            <br>
                            ${statusText}

                            ${
                                data.days_left !== undefined
                                    ? `<br>Days Left: ${data.days_left}`
                                    : ""
                            }

                            ${
                                data.recommendation
                                    ? `<br>${data.recommendation}`
                                    : ""
                            }
                        `;
                    }

                    // Refresh the dashboard after the OCR operation.
                    await loadExpiryAnalysis();

                } else {

                    if (expiryScanStatus) {
                        expiryScanStatus.innerText =
                            "⚠️ Expiry date नहीं मिली। Clear photo try करें।";
                    }
                }

            } catch (error) {

                console.error("Expiry OCR error:", error);

                if (expiryScanStatus) {
                    expiryScanStatus.innerText =
                        "❌ OCR error: " + error.message;
                }

            } finally {

                expiryScanButton.disabled = false;

                expiryScanButton.innerText =
                    "🔄 Scan Expiry Date Again";

                expiryImageInput.value = "";
            }
        }
    );
}


// =====================================
// CHAT ASSISTANT
// =====================================

function initializeChatAssistant() {

    const chatInput =
        document.getElementById("chatInput");

    const chatSendButton =
        document.getElementById("chatSendButton");


    if (chatSendButton && chatInput) {

        chatSendButton.addEventListener("click", handleChat);

        chatInput.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                event.preventDefault();
                handleChat();
            }
        });
    }


    // Quick assistant buttons send their questions to the chat.

    const assistantButtons =
        document.querySelectorAll(".assistant-btn");

    assistantButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const question =
                this.dataset.question || this.innerText || "";

            if (!chatInput) {
                console.warn("Chat input element not found.");
                return;
            }

            chatInput.value = question;
            handleChat();
        });
    });
}


// =====================================
// ADD CHAT MESSAGE
// =====================================

function addChatMessage(message, type) {

    const chatMessages =
        document.getElementById("chatMessages");

    if (!chatMessages) {
        console.warn("Chat messages element not found.");
        return;
    }


    const div = document.createElement("div");

    div.className =
        type === "user"
            ? "user-message"
            : "ai-message";


    // User text is plain text; AI responses may contain formatted HTML.

    if (type === "user") {
        div.textContent = message;
    } else {
        div.innerHTML = message;
    }


    chatMessages.appendChild(div);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// =====================================
// CHAT LOGIC
// =====================================

async function handleChat() {

    const chatInput =
        document.getElementById("chatInput");

    if (!chatInput) {
        return;
    }


    const originalQuestion =
        chatInput.value.trim();

    const question =
        originalQuestion.toLowerCase();


    if (!question) {
        return;
    }


    addChatMessage(originalQuestion, "user");

    chatInput.value = "";


    try {

        let answer = "";


        // Find the product mentioned in the question.

        const matchedProduct =
            salesData.find(function (item) {
                return questionMatchesProduct(
                    question,
                    item.product
                );
            });


        // =================================
        // PRODUCT-SPECIFIC STOCK
        // =================================

// PRODUCT-SPECIFIC STOCK
if (
    matchedProduct &&
    (
        question.includes("stock") ||
        question.includes("kitna") ||
        question.includes("kitni") ||
        question.includes("quantity") ||
        question.includes("available") ||
        question.includes("bacha")
    )
) {
    const detectedProduct = detectedInventory.find(function (item) {
        return productNamesMatch(
            item.product,
            matchedProduct.product
        );
    });

    if (detectedProduct) {
        addChatMessage(
            capitalize(matchedProduct.product) +
            " ka detected stock " +
            detectedProduct.count +
            " hai.",
            "assistant"
        );
    } else {
        addChatMessage(
            capitalize(matchedProduct.product) +
            " shelf scan mein detect nahi hua. Please shelf dobara scan karein.",
            "assistant"
        );
    }

    return;
}
        // =================================
        // GENERAL RESTOCK
        // =================================

        else if (
            question.includes("restock") ||
            question.includes("stock") ||
            question.includes("mangwana")
        ) {

            if (salesData.length > 0) {

                const products =
                    salesData
                        .slice(0, 3)
                        .map(function (item) {
                            return capitalize(item.product);
                        })
                        .join(", ");


                answer =
                    "🛒 Restock के लिए " +
                    products +
                    " जैसे products का stock check करें.";

            } else {

                answer =
                    "📊 Sales data अभी उपलब्ध नहीं है.";
            }
        }


        // =================================
        // PRODUCT-SPECIFIC SALES
        // =================================

        else if (
            matchedProduct &&
            (
                question.includes("sale") ||
                question.includes("selling") ||
                question.includes("bik")
            )
        ) {

            answer =
                "📈 <strong>" +
                capitalize(matchedProduct.product) +
                "</strong> की sales trend: " +
                (matchedProduct.trend || "Unknown") +
                ".<br><br>" +

                "Average daily sales: " +
                matchedProduct.average_daily_demand +
                " units/day<br>" +

                "AI predicted demand: " +
                matchedProduct.predicted_daily_demand +
                " units/day";
        }


        // =================================
        // GENERAL SALES
        // =================================

        else if (
            question.includes("sale") ||
            question.includes("selling") ||
            question.includes("bik")
        ) {

            const increasing =
                salesData.filter(function (item) {
                    return item.trend === "Increasing";
                });


            if (increasing.length > 0) {

                answer =
                    "📈 Increasing sales trend वाले products: " +
                    increasing
                        .map(function (item) {
                            return capitalize(item.product);
                        })
                        .join(", ");

            } else {

                answer =
                    "📊 अभी कोई strong increasing sales trend नहीं मिला.";
            }
        }


        // =================================
        // EXPIRY QUESTIONS
        // =================================

        else if (
            question.includes("expiry") ||
            question.includes("expire") ||
            question.includes("khatam")
        ) {

            const response =
                await fetch("/expiry-analysis");

            if (!response.ok) {
                throw new Error("Expiry data could not be loaded.");
            }

            const data = await response.json();

            let risky = data.filter(function (item) {
                return (
                    item.status === "Expired" ||
                    item.status === "Expiring Soon"
                );
            });


            // If the question names a product, filter by that product.

            if (matchedProduct) {

                risky = risky.filter(function (item) {
                    return productNamesMatch(
                        item.product,
                        matchedProduct.product
                    );
                });
            }


            if (risky.length === 0) {

                answer =
                    "🟢 अभी " +
                    (
                        matchedProduct
                            ? capitalize(matchedProduct.product) + " की"
                            : ""
                    ) +
                    " कोई risky expiry नहीं मिली.";

            } else {

                answer =
                    "⏰ <strong>Expiry Alert</strong><br><br>" +

                    risky.map(function (item) {

                        return (
                            "• <strong>" +
                            capitalize(item.product) +
                            "</strong> — " +
                            item.status +
                            "<br>📅 Expiry: " +
                            (item.expiry_date ?? "N/A") +
                            "<br>⏳ Days left: " +
                            (item.days_left ?? "N/A")
                        );

                    }).join("<br><br>");
            }
        }


        // =================================
        // DEFAULT RESPONSE
        // =================================

        else {

            answer =
                "🤖 मैं Stock, Sales और Expiry से जुड़े सवालों का जवाब दे सकता हूँ.";
        }


        addChatMessage(answer, "ai");

    } catch (error) {

        console.error("Chat error:", error);

        addChatMessage(
            "❌ अभी जवाब नहीं मिल पाया। कृपया दोबारा कोशिश करें।",
            "ai"
        );
    }
}

