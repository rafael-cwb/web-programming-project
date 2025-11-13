// ========== BOTÕES DELETAR E EDITAR ==========
document.addEventListener("click", async (event) => {
  if (event.target.classList.contains("button_delete_element")) {
    const linkDiv = event.target.closest(".link_related_subdiv");
    const id_link = linkDiv?.dataset.id;

    if (id_link) {
      if (confirm("Tem certeza que deseja deletar este link?")) {
        await deletarLink(id_link);
        linkDiv.remove();
        await mostrarQtdLinks(); // atualiza contador
      }
    }
  }

  if (event.target.classList.contains("button_edit_element")) {
    const linkDiv = event.target.closest(".link_related_subdiv");
    const id_link = linkDiv?.dataset.id;
    
    if (id_link) {
      await abrirModalEditarTags(id_link);
    }
  }

});


// ========== CLICAR NO LINK (futuro uso) ==========
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("element_URL_fitcontent_subdiv")) {
    const urlCurta = event.target.textContent.trim();
    navigator.clipboard.writeText(urlCurta);
    alert("Link copiado!");
  }
});

// ========== MOSTRAR NOME NA PÁGINA ==========
async function mostrarNome() {
  try {
    const response = await fetch("database/api/checkSession.php", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erro ao buscar info do usuário: " + response.status);

    const resultado = await response.json();
    if (!resultado.loggedIn) throw new Error(resultado.message);

    const nome = resultado.user.nome || 'Lorem Ipsum Dolor';
    const username = document.getElementById("profile_username_p");

    if (!username) return;
	
	username.textContent = nome;

  } catch (erro) {
    console.error("Erro ao carregar nome:", erro);
  }
}

// ========== LISTAR E CONTAR LINKS ==========
async function mostrarQtdLinks() {
  try {
    const response = await fetch("database/api/links.php", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erro ao buscar links: " + response.status);

    const resultado = await response.json();
    if (!resultado.success) throw new Error(resultado.message);

    const links = resultado.links || [];
    const qtdLinks = document.getElementById("profile_links_count_p");

    if (!qtdLinks) return;

    if (links.length === 0) {
      qtdLinks.textContent = "No links created.";
    } else if (links.length === 1) {
      qtdLinks.textContent = "1 link created.";
    } else {
      qtdLinks.textContent = `${links.length} links created.`;
    }

  } catch (erro) {
    console.error("Erro ao carregar links:", erro);
  }
}


async function renderizarLinks() {
  try {
    const response = await fetch("database/api/links.php", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erro ao buscar links: " + response.status);

    const resultado = await response.json();
    if (!resultado.success) throw new Error(resultado.message);

    const links = resultado.links || [];
    const container = document.getElementById("links_container");
    if (!container) return;

    container.innerHTML = "";

    links.forEach((link) => {
      const div = document.createElement("div");
      div.classList.add("link_summary_div", "link_related_subdiv");
      div.dataset.id = link.id_link;

      const tagsHTML = link.tags
        ? link.tags.map((tag) => `<span>${tag}</span>`).join("")
        : "";
      
      // Determinar texto do botão baseado na existência de tags
      const editButtonText = (link.tags && link.tags.length > 0) ? "Editar" : "Add";

      div.innerHTML = `
        <div class="element_URL_subdiv">
          <div class="element_URL_fitcontent_subdiv">
            <span></span>
            <p class="short_link_URL dashboard_link_URL">${link.url_curta}</p>
            <p class="long_link_URL dashboard_link_URL">${link.url_original}</p>
            <span></span>
          </div>
          <div class="element_tags_subdiv">
            ${tagsHTML}
          </div>
        </div>
        <div class="element_CRUD_subdiv">
          <button class="button_CRUD button_delete_element" onclick="${link.id_link}"><span></span>Delete</button>
          <button class="button_CRUD button_edit_element"><span></span>${editButtonText}</button>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (erro) {
    console.error("Erro ao renderizar links:", erro);
  }
}




// ========== CRIAR LINK ==========
async function criarLink() {
  try {
    const urlOriginal = document.getElementById("input_url")?.value?.trim();

    if (!urlOriginal) {
      alert("Digite uma URL válida!");
      return;
    }

    const response = await fetch("database/api/links.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url_original: urlOriginal })
    });

    const data = await response.json();
    console.log(data);

    if (data.success) {
      alert("Link criado com sucesso: " + data.link.url_curta);
      document.getElementById("input_url").value = "";
      await mostrarQtdLinks();
    } else {
      alert("Erro ao criar link: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao criar link:", error);
  }
}


// ========== DELETAR LINK ==========
async function deletarLink(id_link) {
  try {
    const response = await fetch("database/api/links.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_link }),
    });

    const data = await response.json();
    console.log(data);

    if (data.success) {
      console.log("Link deletado com sucesso.");
    } else {
      alert("Erro ao deletar link: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao deletar link:", error);
  }
}

// ========== GERENCIAMENTO DE TAGS ==========

// Buscar todas as tags do usuário
async function buscarTodasTags() {
  try {
    const response = await fetch("database/api/tags.php", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erro ao buscar tags: " + response.status);

    const resultado = await response.json();
    if (!resultado.success) throw new Error(resultado.message);

    return resultado.tags || [];
  } catch (erro) {
    console.error("Erro ao buscar tags:", erro);
    return [];
  }
}

// Buscar tags de um link específico
async function buscarTagsLink(id_link) {
  try {
    const response = await fetch(`database/api/link_tags.php?id_link=${id_link}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erro ao buscar tags do link: " + response.status);

    const resultado = await response.json();
    if (!resultado.success) throw new Error(resultado.message);

    return resultado.tags || [];
  } catch (erro) {
    console.error("Erro ao buscar tags do link:", erro);
    return [];
  }
}

// Abrir floating window para gerenciar tags de um link
async function abrirModalEditarTags(id_link) {
  try {
    // Buscar todas as tags disponíveis
    const todasTags = await buscarTodasTags();
    
    // Buscar tags atuais do link
    const tagsAtuais = await buscarTagsLink(id_link);
    const idsTagsAtuais = tagsAtuais.map(tag => tag.id_tag);

    // Se não tem tags, mostrar opção de criar
    if (todasTags.length === 0) {
      const criarTag = confirm("Você ainda não tem tags. Deseja criar uma nova tag agora?");
      if (criarTag) {
        await criarTagViaModal();
        // Recarregar tags após criação
        const novasTags = await buscarTodasTags();
        if (novasTags.length === 0) return; // Se ainda não tem tags, sair
        else {
          // Continuar com as novas tags
          await abrirModalEditarTags(id_link);
          return;
        }
      } else {
        return;
      }
    }

    // Criar floating window
    const modal = document.createElement('div');
    modal.id = 'tag_modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(20, 13, 28, 0.8); display: flex; justify-content: center; 
      align-items: center; z-index: 1000; backdrop-filter: blur(2px);
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: var(--link_bg); padding: 25px; 
      border-radius: var(--general_border_radius); 
      min-width: 450px; max-width: 600px; max-height: 80vh; 
      overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      border: 1px solid var(--highlight_purple);
      color: var(--dark_text_color);
    `;

    const temTags = idsTagsAtuais.length > 0;
    const titulo = temTags ? "Editar Tags do Link" : "Adicionar Tags ao Link";

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: var(--highlight_purple); font-size: 18px;">${titulo}</h3>
        <button id="criar_nova_tag_btn" style="
          padding: 6px 12px; background: var(--highlight_blue); color: white; 
          border: none; border-radius: 6px; cursor: pointer; font-size: 12px;
          transition: background 0.2s;
        " onmouseover="this.style.background='var(--hover_highlight_blue)'" 
           onmouseout="this.style.background='var(--highlight_blue)'">
          + Nova Tag
        </button>
      </div>
      <p style="margin-bottom: 15px; color: var(--dark_text_color);">
        Selecione as tags que deseja associar a este link:
      </p>
      <div id="tag_checkboxes" style="margin: 15px 0; max-height: 300px; overflow-y: auto;">
        ${todasTags.map(tag => `
          <label style="
            display: flex; align-items: center; margin: 12px 0; cursor: pointer;
            padding: 8px; border-radius: 6px; transition: background 0.2s;
            background: ${idsTagsAtuais.includes(tag.id_tag) ? 'var(--highlight_text_color)' : 'white'};
          " onmouseover="this.style.background='var(--highlight_text_color)'" 
             onmouseout="this.style.background='${idsTagsAtuais.includes(tag.id_tag) ? 'var(--highlight_text_color)' : 'white'}'">
            <input type="checkbox" value="${tag.id_tag}" 
              ${idsTagsAtuais.includes(tag.id_tag) ? 'checked' : ''} 
              style="margin-right: 12px; transform: scale(1.2);">
            <span style="font-weight: 500;">${tag.nome}</span>
          </label>
        `).join('')}
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 25px;">
        <button id="cancel_tags" style="
          padding: 10px 20px; border: 1px solid var(--secondary_text_color); 
          background: white; border-radius: 6px; cursor: pointer;
          color: var(--dark_text_color); transition: all 0.2s;
        " onmouseover="this.style.background='#f5f5f5'" 
           onmouseout="this.style.background='white'">
          Cancelar
        </button>
        <button id="save_tags" style="
          padding: 10px 20px; border: none; background: var(--highlight_purple); 
          color: white; border-radius: 6px; cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='var(--hover_highlight_blue)'" 
           onmouseout="this.style.background='var(--highlight_purple)'">
          ${temTags ? 'Salvar Alterações' : 'Adicionar Tags'}
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('cancel_tags').onclick = () => {
      document.body.removeChild(modal);
    };

    document.getElementById('criar_nova_tag_btn').onclick = async () => {
      await criarTagViaModal();
      document.body.removeChild(modal);
      // Reabrir modal com novas tags
      await abrirModalEditarTags(id_link);
    };

    document.getElementById('save_tags').onclick = async () => {
      const checkboxes = document.querySelectorAll('#tag_checkboxes input[type="checkbox"]');
      const selectedTagIds = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));

      await atualizarTagsLink(id_link, selectedTagIds);
      document.body.removeChild(modal);
      await renderizarLinks();
    };

    // Fechar ao clicar fora do modal
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };

  } catch (erro) {
    console.error("Erro ao abrir modal de tags:", erro);
    alert("Erro ao abrir editor de tags: " + erro.message);
  }
}

// Criar nova tag via modal
async function criarTagViaModal() {
  const nomeTag = prompt("Digite o nome da nova tag:");
  if (!nomeTag || !nomeTag.trim()) {
    return;
  }

  try {
    const response = await fetch("database/api/tags.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ nome: nomeTag.trim() }),
    });

    const data = await response.json();
    if (data.success) {
      alert("Tag criada com sucesso!");
    } else {
      alert("Erro ao criar tag: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao criar tag:", error);
    alert("Erro ao criar tag: " + error.message);
  }
}

// Atualizar tags de um link
async function atualizarTagsLink(id_link, tag_ids) {
  try {
    const response = await fetch("database/api/link_tags.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_link, tag_ids }),
    });

    const data = await response.json();
    console.log(data);

    if (data.success) {
      alert("Tags atualizadas com sucesso!");
    } else {
      alert("Erro ao atualizar tags: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao atualizar tags:", error);
    alert("Erro ao atualizar tags: " + error.message);
  }
}

// Adicionar uma tag a um link
async function adicionarTagAoLink(id_link, id_tag) {
  try {
    const response = await fetch("database/api/link_tags.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_link, id_tag }),
    });

    const data = await response.json();
    console.log(data);

    if (data.success) {
      alert("Tag adicionada ao link com sucesso!");
      await renderizarLinks();
    } else {
      alert("Erro ao adicionar tag: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao adicionar tag:", error);
    alert("Erro ao adicionar tag: " + error.message);
  }
}

// Remover uma tag de um link
async function removerTagDoLink(id_link, id_tag = null) {
  try {
    const body = { id_link };
    if (id_tag) body.id_tag = id_tag;

    const response = await fetch("database/api/link_tags.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(data);

    if (data.success) {
      alert(id_tag ? "Tag removida do link com sucesso!" : "Todas as tags removidas do link!");
      await renderizarLinks();
    } else {
      alert("Erro ao remover tag: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao remover tag:", error);
    alert("Erro ao remover tag: " + error.message);
  }
}


// ========== AO CARREGAR A PÁGINA ==========
document.addEventListener("DOMContentLoaded", () => {
  mostrarNome();
  mostrarQtdLinks();
  renderizarLinks();
});
