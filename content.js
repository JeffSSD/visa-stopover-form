// ===== ARQUIVO 4: content.js (A VERDADEIRA VERSÃO HÍBRIDA) =====

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'fillForm') {
    try {
      fillVisaForm(request.data);
      sendResponse({ success: true, message: "Formulário preenchido com sucesso!" });
    } catch (error) {
      console.error('Erro ao preencher o formulário:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

function fillVisaForm(data) {
  console.log("Iniciando preenchimento com a versão HÍBRIDA FINAL, combinando as duas soluções que funcionam.");

  setTimeout(() => {
    // --- PARTE 1: Lógica de 'findContainerByVisibleText' para textos e datas (a sua versão que já funciona) ---
    console.log("Preenchendo textos/datas com a sua versão funcional...");
    fillInputByVisibleText("Primeiro nome*", data.firstName);
    fillInputByVisibleText("Apelido*", data.lastName);
    fillInputByVisibleText("Número de passaporte*", data.passportNumber);
    fillInputByVisibleText("Data de nascimento*", formatDateDDMMYYYY(data.dateOfBirth));
    fillInputByVisibleText("Data de validade do passaporte*", formatDateDDMMYYYY(data.passportExpiry));
    fillInputBySelector('input[type="email"]', data.email); // Este seletor simples sempre funcionou bem
    fillContactNumber("Número de contacto*", data.countryCode, data.contactNumber);

    // --- PARTE 2: Lógica de 'selectOptionInDropdown' por ordem (a que funcionou para os menus) ---
    console.log("Preenchendo menus de seleção por ordem...");
    setTimeout(() => {
      selectOptionInDropdown(0, data.gender, true); // Gênero é o primeiro dropdown
    }, 500);
    setTimeout(() => {
      selectOptionInDropdown(1, data.nationality); // Nacionalidade é o segundo
    }, 1200);

  }, 1500);
}


// --- FUNÇÕES QUE FUNCIONAM PARA TEXTO/DATA (DO SEU CÓDIGO) ---

function findContainerByVisibleText(text) {
    const elements = document.querySelectorAll('div, span, p, label');
    const normalizedText = text.replace(/\*/g, '').trim().toLowerCase();
    for (const el of elements) {
        const elText = el.textContent.replace(/\*/g, '').trim().toLowerCase();
        if (elText.startsWith(normalizedText)) {
            const parentContainer = el.closest('div[class*="form-group"], div[class*="form-field"], div');
            if (parentContainer) {
                return parentContainer;
            }
        }
    }
    return null;
}

function fillInputByVisibleText(labelText, value) {
    if (!value) return;
    const container = findContainerByVisibleText(labelText);
    if (container) {
        const element = container.querySelector('input');
        if(element) {
            setElementValue(element, value);
            console.log(`SUCESSO ao preencher o input para "${labelText}".`);
        } else {
            console.warn(`Campo input não encontrado no container de "${labelText}".`);
        }
    } else {
        console.warn(`FALHA ao encontrar o container para a etiqueta "${labelText}".`);
    }
}

function fillContactNumber(labelText, countryCode, contactNumber) {
    const fieldContainer = findContainerByVisibleText(labelText);
    if (fieldContainer) {
        const inputs = fieldContainer.querySelectorAll('input');
        if (inputs.length >= 2) {
            if (countryCode) setElementValue(inputs[0], countryCode.replace('+', ''));
            if (contactNumber) setElementValue(inputs[1], contactNumber);
            console.log(`SUCESSO ao preencher o número de contato.`);
        }
    } else {
        console.warn(`FALHA ao encontrar o container para "${labelText}".`);
    }
}


// --- FUNÇÃO QUE FUNCIONA PARA MENUS (DA VERSÃO ESTRUTURAL) ---

function selectOptionInDropdown(dropdownIndex, optionText, isGender = false) {
    if (!optionText) return;
    const allDropdowns = document.querySelectorAll('mat-select[role="combobox"], [role="combobox"]');
    
    if (allDropdowns.length <= dropdownIndex) {
        console.error(`ERRO: Dropdown com índice ${dropdownIndex} não encontrado.`);
        return;
    }

    const dropdownToClick = allDropdowns[dropdownIndex];
    dropdownToClick.click();

    setTimeout(() => {
        const genderMap = { 'Male': 'Masculino', 'Female': 'Feminino', 'Other': 'Outro' };
        const targetText = isGender ? (genderMap[optionText] || optionText) : optionText;
        // Seletor mais específico para opções do Angular Material
        const options = document.querySelectorAll('mat-option[role="option"], li[role="option"]');
        let found = false;

        for (const option of options) {
            if (option.textContent.trim().toLowerCase().includes(targetText.toLowerCase())) {
                option.click();
                console.log(`SUCESSO (Ordem): Opção "${targetText}" selecionada no dropdown #${dropdownIndex + 1}.`);
                found = true;
                break;
            }
        }
        if (!found) {
            console.error(`ERRO: Opção "${targetText}" não encontrada no dropdown #${dropdownIndex + 1}.`);
            document.body.click();
        }
    }, 700);
}


// --- Funções Base (Comuns e necessárias) ---

function fillInputBySelector(selector, value) {
  if (!value) return;
  const element = document.querySelector(selector);
  if (element) setElementValue(element, value);
}

function setElementValue(element, value) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.focus();
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.blur();
}

function formatDateDDMMYYYY(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}