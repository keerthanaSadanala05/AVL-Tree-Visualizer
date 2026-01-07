class Node {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

let root = null;
let lastModified = null;
let highlightTimeout = null;

const LEVEL_GAP = 120;
const NODE_GAP = 100;

const h = n => n ? n.height : 0;
const bf = n => n ? h(n.left) - h(n.right) : 0;

function update(n) {
    n.height = 1 + Math.max(h(n.left), h(n.right));
}

function rightRotate(y) {
    let x = y.left;
    let T2 = x.right;
    x.right = y;
    y.left = T2;
    update(y);
    update(x);
    return x;
}

function leftRotate(x) {
    let y = x.right;
    let T2 = y.left;
    y.left = x;
    x.right = T2;
    update(x);
    update(y);
    return y;
}

function balanceNode(node) {
    update(node);
    let balance = bf(node);

    if (balance > 1) {
        if (bf(node.left) >= 0) {
            return rightRotate(node);
        } else {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }
    }

    if (balance < -1) {
        if (bf(node.right) <= 0) {
            return leftRotate(node);
        } else {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }
    }

    return node;
}

function insert(node, val) {
    if (!node) return new Node(val);

    if (val < node.val) {
        node.left = insert(node.left, val);
    } else if (val > node.val) {
        node.right = insert(node.right, val);
    } else {
        return node;
    }

    return balanceNode(node);
}

function minValueNode(node) {
    let current = node;
    while (current.left) {
        current = current.left;
    }
    return current;
}

function deleteNode(node, val) {
    if (!node) return null;

    if (val < node.val) {
        node.left = deleteNode(node.left, val);
    } else if (val > node.val) {
        node.right = deleteNode(node.right, val);
    } else {
        if (!node.left || !node.right) {
            let temp = node.left ? node.left : node.right;
            
            lastModified = { type: 'delete', val: node.val };
            
            if (!temp) {
                return null;
            } else {
                return temp;
            }
        } else {
            let temp = minValueNode(node.right);
            node.val = temp.val;
            node.right = deleteNode(node.right, temp.val);
        }
    }

    return balanceNode(node);
}

function insertValue() {
    let input = document.getElementById("value");
    let v = parseInt(input.value);
    
    if (isNaN(v)) {
        showAction("Please enter a valid number", "error");
        return;
    }
    
    if (v < 0 || v > 999) {
        showAction("Please enter a number between 0-999", "error");
        return;
    }
    
    root = insert(root, v);
    lastModified = { type: 'insert', val: v };
    input.value = "";
    input.focus();
    render();
    updateStatus();
}

function deleteValue() {
    let input = document.getElementById("value");
    let v = parseInt(input.value);
    
    if (isNaN(v)) {
        showAction("Please enter a valid number to delete", "error");
        return;
    }
    
    if (!root) {
        showAction("Tree is empty", "error");
        return;
    }
    
    let oldRoot = root;
    root = deleteNode(root, v);
    
    if (root === oldRoot) {
        showAction(`Value ${v} not found in tree`, "error");
    } else {
        showAction(`✓ Deleted: ${v}`, "success");
    }
    
    input.value = "";
    input.focus();
    render();
    updateStatus();
}

function randomInsert() {
    let v = Math.floor(Math.random() * 100);
    document.getElementById("value").value = v;
    insertValue();
}

function resetTree() {
    root = null;
    lastModified = null;
    showAction("Tree has been reset", "info");
    render();
    updateStatus();
}

function showAction(message, type = "info") {
    const msgEl = document.getElementById("actionMessage");
    const icon = msgEl.querySelector("i");
    const textSpan = msgEl.querySelector("span");
    
    msgEl.className = "action-message";
    msgEl.classList.add(type);
    
    switch(type) {
        case "success":
            icon.className = "fas fa-check-circle";
            break;
        case "error":
            icon.className = "fas fa-exclamation-circle";
            break;
        case "info":
            icon.className = "fas fa-info-circle";
            break;
    }
    
    textSpan.textContent = message;
    
    if (type === "success") {
        setTimeout(() => {
            if (msgEl.querySelector("span").textContent === message) {
                msgEl.classList.remove("success");
                msgEl.classList.add("info");
                icon.className = "fas fa-info-circle";
                textSpan.textContent = "Enter a number and click Insert to continue";
            }
        }, 3000);
    }
}

let positions = new Map();

function computePositions(root) {
    positions.clear();
    if (!root) return;

    const canvas = document.getElementById("canvas");
    const canvasWidth = canvas.clientWidth;

    function assignPositions(node, depth, minX, maxX) {
        if (!node) return;

        const x = (minX + maxX) / 2;
        const y = depth * LEVEL_GAP + 80;

        positions.set(node, { x, y });

        const childWidth = (maxX - minX) / 2;
        assignPositions(node.left, depth + 1, minX, minX + childWidth);
        assignPositions(node.right, depth + 1, minX + childWidth, maxX);
    }

    assignPositions(root, 0, 50, canvasWidth - 50);
}

function render() {
    const treeDiv = document.getElementById("tree");
    const linesSVG = document.getElementById("lines");
    const emptyState = document.getElementById("emptyState");
    
    treeDiv.innerHTML = "";
    linesSVG.innerHTML = "";

    if (!root) {
        emptyState.style.display = "flex";
        return;
    }
    
    emptyState.style.display = "none";

    computePositions(root);
    drawTree(root);

    if (lastModified) {
        highlightLastModified();
    }
}

function drawTree(node) {
    if (!node) return;

    let pos = positions.get(node);
    
    let el = document.createElement("div");
    el.className = "node";
    el.style.left = (pos.x - 35) + "px";
    el.style.top = pos.y + "px";
    el.textContent = node.val;
    el.dataset.value = node.val;
    
    el.title = `Value: ${node.val}\nHeight: ${node.height}\nBalance: ${bf(node)}`;
    
    if (lastModified && lastModified.val === node.val) {
        el.classList.add(lastModified.type === 'delete' ? 'deleting' : 'highlight');
    }

    document.getElementById("tree").appendChild(el);

    if (node.left) {
        let leftPos = positions.get(node.left);
        drawEdge(pos.x, pos.y + 35, leftPos.x, leftPos.y);
        drawTree(node.left);
    }
    
    if (node.right) {
        let rightPos = positions.get(node.right);
        drawEdge(pos.x, pos.y + 35, rightPos.x, rightPos.y);
        drawTree(node.right);
    }
}

function drawEdge(x1, y1, x2, y2) {
    let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#667eea");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    document.getElementById("lines").appendChild(line);
}

function highlightLastModified() {
    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
    }
    
    highlightTimeout = setTimeout(() => {
        lastModified = null;
        render();
    }, 1500);
}

function countNodes(node) {
    return node ? 1 + countNodes(node.left) + countNodes(node.right) : 0;
}

function isBalanced(node) {
    if (!node) return true;
    
    let balance = bf(node);
    if (Math.abs(balance) > 1) return false;
    
    return isBalanced(node.left) && isBalanced(node.right);
}

function updateStatus() {
    const height = h(root);
    const nodeCount = countNodes(root);
    const balanced = isBalanced(root);
    
    document.getElementById("height").textContent = height;
    document.getElementById("nodeCount").textContent = nodeCount;
    document.getElementById("balanced").textContent = balanced ? "Yes" : "No";
    document.getElementById("balanced").style.color = balanced ? "#4CAF50" : "#f44336";
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("value").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            insertValue();
        }
    });

    window.addEventListener('resize', function() {
        render();
    });

    render();
    updateStatus();
});