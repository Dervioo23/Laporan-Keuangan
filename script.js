// Initialize Chart
let financeChart;

// Format number to Indonesian Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

// Pastikan chart diinisialisasi setelah DOM siap
document.addEventListener('DOMContentLoaded', function() {
  initializeChart();
  loadTransactions();
  updateChart();
  setDefaultDate(); // Add this line
});

function initializeChart() {
  const ctx = document.getElementById('financeChart');
  if (!ctx) {
    console.error('Canvas element not found');
    return;
  }
  
  financeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Pemasukan', 'Pengeluaran'],
      datasets: [{
        label: 'Jumlah (Rp)',
        data: [0, 0],
        backgroundColor: [
          'rgba(74, 222, 128, 0.8)',
          'rgba(248, 113, 113, 0.8)'
        ],
        borderColor: [
          'rgba(74, 222, 128, 1)',
          'rgba(248, 113, 113, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'Rp' + value.toLocaleString('id-ID');
            }
          }
        }
      }
    }
  });
}

// Load transactions from localStorage
function loadTransactions() {
  const transactions = getTransactions();
  const tableBody = document.getElementById('transactionTableBody');
  tableBody.innerHTML = '';

  transactions.forEach((transaction, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">${transaction.date}</td>
      <td class="px-6 py-4 whitespace-nowrap">${transaction.productName}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">${formatRupiah(transaction.amount)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right">
        <button class="delete-btn text-red-600 hover:text-red-800" data-index="${index}">
          Hapus
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Add event listeners to all delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        deleteTransaction(index);
      }
    });
  });
}

// Get transactions from localStorage
function getTransactions() {
  return JSON.parse(localStorage.getItem('transactions') || '[]');
}

// Save transaction to localStorage
// Simpan transaksi ke localStorage
function saveTransaction(transaction) {
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  transactions.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Ambil semua transaksi dari localStorage
function getTransactions() {
  return JSON.parse(localStorage.getItem('transactions')) || [];
}

// Hapus transaksi dari localStorage
function deleteTransaction(index) {
  let transactions = getTransactions();
  transactions.splice(index, 1);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  
  // Update all visual components
  loadTransactions();
  updateChart();
  updateFinancialSummary();
  
  showToast('Transaksi berhasil dihapus');
}

// Update chart with current totals
function updateChart() {
  if (!financeChart) {
    console.error('Chart not initialized');
    return;
  }

  const transactions = getTransactions();
  const totals = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'income') {
      acc.income += transaction.amount;
    } else {
      acc.expenses += transaction.amount;
    }
    return acc;
  }, { income: 0, expenses: 0 });

  financeChart.data.datasets[0].data = [totals.income, totals.expenses];
  financeChart.update();
}

// Export transactions to CSV
// Fungsi untuk menampilkan toast notification
function showToast(message, isSuccess = true) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg text-white ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Fungsi untuk menampilkan loading spinner
function showLoading(show) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (show) {
    loadingOverlay.classList.remove('hidden');
  } else {
    loadingOverlay.classList.add('hidden');
  }
}

// Update form submission dengan validasi dan feedback
// Fungsi untuk menampilkan notifikasi form
function showFormNotification(message, type = 'success') {
  const notification = document.getElementById('formNotification');
  notification.textContent = message;
  notification.className = `mt-4 px-4 py-3 rounded-md text-sm ${type}`;
  notification.classList.remove('hidden');
  
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

// Update form submission untuk menggunakan notifikasi
document.getElementById('transactionForm').addEventListener('submit', function (e) {
  e.preventDefault();

  // Validasi form
  const date = document.getElementById('date').value;
  const productName = document.getElementById('productName').value;
  const amount = document.getElementById('amount').value;
  
  if (!date || !productName || !amount) {
    showFormNotification('Harap isi semua field!', 'error');
    return;
  }
  
  if (parseFloat(amount) <= 0) {
    showFormNotification('Jumlah harus lebih dari 0', 'warning');
    return;
  }

  const transaction = {
    date,
    productName,
    type: document.getElementById('type').value,
    amount: parseFloat(amount),
  };

  saveTransaction(transaction);
  loadTransactions();
  updateChart();
  this.reset();
  
  showFormNotification('Transaksi berhasil ditambahkan!');
});

// Update exportToCsv dengan loading state
function exportToCsv() {
  showLoading(true);
  setTimeout(() => {
    const transactions = getTransactions();
    if (transactions.length === 0) {
      showToast('Tidak ada data untuk di-export', false);
      showLoading(false);
      return;
    }
    
    const csvContent = [['Tanggal', 'Nama Produk', 'Jenis', 'Jumlah'], ...transactions.map((t) => [t.date, t.productName, t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', formatRupiah(t.amount)])].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'transaksi.csv');
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('File CSV berhasil diunduh');
    showLoading(false);
  }, 500);
}

document.getElementById('downloadCsv').addEventListener('click', exportToCsv);


function updateFinancialSummary() {
  const transactions = getTransactions();
  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.income += transaction.amount;
      } else {
        acc.expenses += transaction.amount;
      }
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  const balance = totals.income - totals.expenses;
  
  document.getElementById('totalIncome').textContent = formatRupiah(totals.income);
  document.getElementById('totalExpense').textContent = formatRupiah(totals.expenses);
  document.getElementById('totalBalance').textContent = formatRupiah(balance);
}

// Update the initialize function to include the summary
function initialize() {
  initializeChart();
  loadTransactions();
  updateChart();
  updateFinancialSummary(); // Add this line
}

// Update all functions that modify transactions to also update the summary
function saveTransaction(transaction) {
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  transactions.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  updateFinancialSummary(); // Add this line
}

function deleteTransaction(index) {
  let transactions = getTransactions();
  transactions.splice(index, 1);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  updateFinancialSummary(); // Add this line
}

// Update this function to refresh chart when new data is added
document.getElementById('transactionForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const transaction = {
    date: document.getElementById('date').value,
    productName: document.getElementById('productName').value,
    type: document.getElementById('type').value,
    amount: parseFloat(document.getElementById('amount').value),
  };

  saveTransaction(transaction);
  loadTransactions();
  updateChart();
  this.reset();
  setDefaultDate(); // Add this line to reset date after submission
  
  showFormNotification('Transaksi berhasil ditambahkan!');
});


function deleteAllTransactions() {
  if (confirm('Apakah Anda yakin ingin menghapus SEMUA transaksi? Tindakan ini tidak dapat dibatalkan.')) {
    localStorage.setItem('transactions', JSON.stringify([]));
    loadTransactions();
    updateChart();
    updateFinancialSummary();
    showToast('Semua transaksi berhasil dihapus');
  }
}

// Add event listener for delete all button at the bottom of the file
document.getElementById('deleteAllBtn')?.addEventListener('click', deleteAllTransactions);


// Add this new function
function setDefaultDate() {
  const today = new Date();
  const dateInput = document.getElementById('date');
  
  // Format date as YYYY-MM-DD (required by input type="date")
  const formattedDate = today.toISOString().split('T')[0];
  dateInput.value = formattedDate;
}
