// ===== ARQUIVO 3: popup.js (VERSÃO COMPLETA E CORRIGIDA) =====

document.addEventListener('DOMContentLoaded', function() {
  // Carregamento inicial
  loadProfiles();
  loadCurrentIndex();
  
  // ----- GESTÃO DAS ABAS (TABS) -----
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      showTab(this.getAttribute('data-tab'));
    });
  });

  // ----- GESTÃO DO FORMULÁRIO DE ADIÇÃO -----
  document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addProfile();
  });
  
  document.getElementById('clearFormBtn').addEventListener('click', clearForm);
  
  // ----- BOTÕES GLOBAIS -----
  document.getElementById('fillNextBtn').addEventListener('click', fillNext);
  document.getElementById('resetIndexBtn').addEventListener('click', resetIndex);

  // ----- BOTÕES DE IMPORTAR/EXPORTAR -----
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', importData);
  document.getElementById('loadSampleBtn').addEventListener('click', loadSampleData);

  // ----- DELEGAÇÃO DE EVENTOS PARA A LISTA DE PERFIS (A GRANDE CORREÇÃO) -----
  // Em vez de adicionar um evento a cada botão, adicionamos um único evento ao container.
  // Isto funciona mesmo para botões adicionados dinamicamente.
  document.getElementById('profilesList').addEventListener('click', function(e) {
    const target = e.target; // O elemento exato que foi clicado

    // Verifica se o clique foi num botão "Preencher Este"
    if (target && target.matches('.fill-btn[data-index]')) {
      const index = parseInt(target.getAttribute('data-index'));
      fillForm(index);
    }
    
    // Verifica se o clique foi num botão "Excluir"
    if (target && target.matches('.delete-btn[data-id]')) {
      const id = parseInt(target.getAttribute('data-id'));
      deleteProfile(id);
    }
  });
});


// ----- DEFINIÇÃO DE VARIÁVEIS GLOBAIS -----
let profiles = [];
let currentIndex = 0;


// ----- FUNÇÕES PRINCIPAIS -----

function showTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(tabName + 'Tab').classList.add('active');
  
  if (tabName === 'import') {
    exportData();
  }
}

function loadProfiles() {
  chrome.storage.local.get(['profiles'], function(result) {
    profiles = result.profiles || [];
    displayProfiles();
  });
}

function loadCurrentIndex() {
  chrome.storage.local.get(['currentIndex'], function(result) {
    currentIndex = result.currentIndex || 0;
    updateIndexDisplay();
  });
}

function saveProfiles() {
  chrome.storage.local.set({profiles: profiles}, function() {
    loadProfiles(); // Recarrega e exibe os perfis atualizados
  });
}

function saveCurrentIndex() {
  chrome.storage.local.set({currentIndex: currentIndex}, function() {
    updateIndexDisplay();
  });
}

function updateIndexDisplay() {
  const total = profiles.length > 0 ? profiles.length : 'N/A';
  document.getElementById('currentIndexDisplay').textContent = `Próximo: ${currentIndex + 1} / ${total}`;
}

function addProfile() {
  const profile = {
    id: Date.now(),
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    gender: document.getElementById('gender').value,
    dateOfBirth: document.getElementById('dateOfBirth').value,
    nationality: document.getElementById('nationality').value.trim(),
    passportNumber: document.getElementById('passportNumber').value.trim(),
    passportExpiry: document.getElementById('passportExpiry').value,
    countryCode: document.getElementById('countryCode').value.trim(),
    contactNumber: document.getElementById('contactNumber').value.trim(),
    email: document.getElementById('email').value.trim()
  };
  
  profiles.push(profile);
  saveProfiles();
  showStatus('Perfil adicionado com sucesso!', 'success');
  clearForm();
  showTab('profiles');
}

function clearForm() {
  document.getElementById('profileForm').reset();
  document.getElementById('countryCode').value = '+55';
}

function displayProfiles() {
  const container = document.getElementById('profilesList');
  container.innerHTML = '';
  
  if (profiles.length === 0) {
    updateIndexDisplay();
    return;
  }
  
  profiles.forEach((profile, index) => {
    const profileDiv = document.createElement('div');
    profileDiv.className = 'profile-item';
    profileDiv.innerHTML = `
      <div class="profile-header">
        <span class="profile-name">${index + 1}. ${profile.firstName} ${profile.lastName}</span>
        <span style="color: #666; font-size: 12px;">Passport: ${profile.passportNumber}</span>
      </div>
      <div class="profile-details">
        <strong>Gender:</strong> ${profile.gender} | 
        <strong>DOB:</strong> ${formatDate(profile.dateOfBirth)} | 
        <strong>Nationality:</strong> ${profile.nationality}<br>
        <strong>Passport Exp:</strong> ${formatDate(profile.passportExpiry)} | 
        <strong>Phone:</strong> ${profile.countryCode} ${profile.contactNumber}<br>
        <strong>Email:</strong> ${profile.email}
      </div>
      <div class="profile-actions">
        <button class="fill-btn" data-index="${index}">Preencher Este</button>
        <button class="delete-btn" data-id="${profile.id}">Excluir</button>
      </div>
    `;
    container.appendChild(profileDiv);
  });
  updateIndexDisplay();
}

function fillForm(index) {
  if (profiles[index]) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'fillForm',
        data: profiles[index]
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Erro: A página do formulário não respondeu. Recarregue a página e tente novamente.', 'error');
          console.error(chrome.runtime.lastError.message);
        } else if (response && response.success) {
          showStatus(`Formulário preenchido com: ${profiles[index].firstName}`, 'success');
        } else {
          showStatus(`Falha ao preencher: ${response.error || 'Erro desconhecido.'}`, 'error');
        }
      });
    });
  }
}

function fillNext() {
  if (profiles.length === 0) {
    showStatus('Nenhum perfil cadastrado', 'error');
    return;
  }
  
  if (currentIndex >= profiles.length) {
    showStatus('Todos os perfis já foram usados. Resetando índice.', 'success');
    currentIndex = 0;
  }
  
  fillForm(currentIndex);
  currentIndex = (currentIndex + 1) % profiles.length; // Avança e volta ao início se chegar ao fim
  saveCurrentIndex();
}

function resetIndex() {
  currentIndex = 0;
  saveCurrentIndex();
  showStatus('Índice resetado. O próximo a ser preenchido é o perfil 1.', 'success');
}

function deleteProfile(id) {
  if (confirm('Tem a certeza de que quer excluir este perfil?')) {
    profiles = profiles.filter(p => p.id !== id);
    // Ajustar currentIndex se o item excluído for o último ou anterior ao atual
    if (currentIndex >= profiles.length && profiles.length > 0) {
      currentIndex = profiles.length - 1;
    }
    saveCurrentIndex();
    saveProfiles();
    showStatus('Perfil excluído com sucesso.', 'success');
  }
}

function exportData() {
  const exportTextarea = document.getElementById('exportData');
  exportTextarea.value = JSON.stringify(profiles, null, 2);
}

function importData() {
  const importTextarea = document.getElementById('importData');
  try {
    const importedProfiles = JSON.parse(importTextarea.value);
    if (Array.isArray(importedProfiles)) {
      importedProfiles.forEach(profile => {
        if (!profile.id) profile.id = Date.now() + Math.random();
      });
      profiles = [...profiles, ...importedProfiles];
      saveProfiles();
      showStatus(`${importedProfiles.length} perfis importados!`, 'success');
      importTextarea.value = '';
      showTab('profiles');
    } else {
      throw new Error('O JSON deve ser uma lista (array) de perfis.');
    }
  } catch (error) {
    showStatus(`Erro ao importar: ${error.message}`, 'error');
  }
}

function loadSampleData() {
  const sampleData = [
    {
      firstName: "João",
      lastName: "Silva",
      gender: "Male", // CORRIGIDO: Usar "Male" para consistência
      dateOfBirth: "2015-08-04",
      nationality: "GUINEA-BISSAU",
      passportNumber: "C0012346",
      passportExpiry: "2030-05-15",
      countryCode: "245",
      contactNumber: "11987654321",
      email: "joao.silva@email.com"
    },
    {
      firstName: "Maria",
      lastName: "Santos",
      gender: "Female", // CORRIGIDO: Usar "Female" para consistência
      dateOfBirth: "1985-08-22",
      nationality: "GUINEA-BISSAU",
      passportNumber: "C0078901",
      passportExpiry: "2029-08-22",
      countryCode: "245",
      contactNumber: "21912345678",
      email: "maria.santos@email.com"
    }
  ];
  
  document.getElementById('importData').value = JSON.stringify(sampleData, null, 2);
  showStatus('Dados de exemplo carregados. Clique em "Importar Perfis" para adicionar.', 'success');
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  
  setTimeout(function() {
    statusDiv.style.display = 'none';
  }, 4000); // Aumentei o tempo para 4 segundos para dar tempo de ler
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  // Adicionar T00:00:00 para evitar problemas de fuso horário que podem mudar o dia
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}