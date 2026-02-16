
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Mock Data Structure matching what the API returns
const mockDuplicates = [
    {
        _id: { itemCode: "LEGACY_001", supplier: "OldSupplier" },
        count: 2,
        docs: [
            {
                // Missing ID
                _id: new mongoose.Types.ObjectId(),
                itemCode: "LEGACY_001",
                supplier: "OldSupplier",
                productName: "Legacy Product 1",
                uploadDate: null, // Invalid date
                updatedAt: undefined
            },
            {
                id: uuidv4(),
                itemCode: "LEGACY_001",
                supplier: "OldSupplier",
                productName: "New Product 1",
                uploadDate: new Date(),
                updatedAt: new Date()
            }
        ]
    }
];

// Replicate Modal Logic
function testModalLogic(duplicates) {
    console.log("Testing Modal Logic with:", JSON.stringify(duplicates, null, 2));

    try {
        const initialWinners = {};
        duplicates.forEach((group) => {
            const groupKey = `${group._id.itemCode}-${group._id.supplier}`;
            console.log(`Processing group: ${groupKey}`);

            // Sort Logic
            const sorted = [...group.docs].sort((a, b) => {
                const getDate = (d) => {
                    const val = d.updatedAt || d.uploadDate;
                    if (!val) return 0;
                    const dateObj = new Date(val);
                    return isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();
                };
                return getDate(b) - getDate(a);
            });

            console.log("Sorted docs:", sorted.map(d => d.productName));
            initialWinners[groupKey] = sorted[0].id || sorted[0]._id.toString(); // Fallback simulation
        });
        console.log("Initial Winners:", initialWinners);
        console.log("Logic Verification: SUCCESS");
    } catch (e) {
        console.error("Logic Verification: FAILED", e);
    }
}

testModalLogic(mockDuplicates);
