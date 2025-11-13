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

  // CREATE TAG BUTTON
  if (event.target.id === "create_tag_btn") {
    await criarNovaTag();
  }

  // EDIT TAG BUTTONS
  if (event.target.classList.contains("edit_tag_btn")) {
    const tagId = event.target.dataset.tagId;
    const tagName = event.target.dataset.tagName;
    await editarTag(tagId, tagName);
  }

  // DELETE TAG BUTTONS
  if (event.target.classList.contains("delete_tag_btn")) {
    const tagId = event.target.dataset.tagId;
    const tagName = event.target.dataset.tagName;
    if (confirm(`Tem certeza que deseja deletar a tag "${tagName}"?`)) {
      await deletarTag(tagId);
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
          <button class="button_CRUD button_edit_element"><span></span>Edit</button>
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
      body: JSON.stringify({ id_link })
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

// Renderizar lista de tags do usuário
async function renderizarTagsUsuario() {
  try {
    const tags = await buscarTodasTags();
    const container = document.getElementById("user_tags_list");
    
    if (!container) return;

    if (tags.length === 0) {
      container.innerHTML = "<p>Você ainda não tem tags. Crie uma acima!</p>";
      return;
    }

    container.innerHTML = tags.map(tag => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; margin: 5px 0; background: white; border-radius: 4px; border: 1px solid #ddd;">
        <span style="font-weight: bold;">${tag.nome}</span>
        <div>
          <button class="edit_tag_btn" data-tag-id="${tag.id_tag}" data-tag-name="${tag.nome}" style="padding: 4px 8px; margin-right: 5px; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 3px; cursor: pointer;">Edit</button>
          <button class="delete_tag_btn" data-tag-id="${tag.id_tag}" data-tag-name="${tag.nome}" style="padding: 4px 8px; border: 1px solid #dc3545; background: #dc3545; color: white; border-radius: 3px; cursor: pointer;">Delete</button>
        </div>
      </div>
    `).join("");

  } catch (erro) {
    console.error("Erro ao renderizar tags:", erro);
  }
}

// Criar nova tag
async function criarNovaTag() {
  try {
    const input = document.getElementById("new_tag_input");
    const nome = input.value.trim();

    if (!nome) {
      alert("Digite um nome para a tag!");
      return;
    }

    const response = await fetch("database/api/tags.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ nome }),
    });

    const data = await response.json();
    console.log(data);

    if (data.success) {
      alert("Tag criada com sucesso!");
      input.value = "";
      await renderizarTagsUsuario();
    } else {
      alert("Erro ao criar tag: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao criar tag:", error);
    alert("Erro ao criar tag: " + error.message);
  }
}

// Editar tag
async function editarTag(id_tag, nomeAtual) {
  try {
    const novoNome = prompt("Editar nome da tag:", nomeAtual);
    
    if (novoNome === null) return; // Cancelado
    if (!novoNome.trim()) {
      alert("Nome da tag não pode estar vazio!");
      return;
    }

    const response = await fetch("database/api/tags.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_tag: parseInt(id_tag), nome: novoNome.trim() }),
    });

    const data = await response.json();
    console.log(data);

    if (data.success) {
      alert("Tag atualizada com sucesso!");
      await renderizarTagsUsuario();
      await renderizarLinks(); // Atualizar links também
    } else {
      alert("Erro ao atualizar tag: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao editar tag:", error);
    alert("Erro ao editar tag: " + error.message);
  }
}

// Deletar tag
async function deletarTag(id_tag) {
  try {
    const response = await fetch("database/api/tags.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_tag: parseInt(id_tag) }),
    });

    const data = await response.json();
    console.log(data);

    if (data.success) {
      alert("Tag deletada com sucesso!");
      await renderizarTagsUsuario();
      await renderizarLinks(); // Atualizar links também
    } else {
      alert("Erro ao deletar tag: " + data.message);
    }
  } catch (error) {
    console.error("Erro ao deletar tag:", error);
    alert("Erro ao deletar tag: " + error.message);
  }
}

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

// Abrir modal para editar tags de um link
async function abrirModalEditarTags(id_link) {
  try {
    // Buscar todas as tags disponíveis
    const todasTags = await buscarTodasTags();
    
    if (todasTags.length === 0) {
      alert("Você ainda não tem tags. Crie algumas tags primeiro na seção 'Manage Tags' acima.");
      return;
    }

    // Buscar tags atuais do link
    const tagsAtuais = await buscarTagsLink(id_link);
    const idsTagsAtuais = tagsAtuais.map(tag => tag.id_tag);

    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'tag_modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
      align-items: center; z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white; padding: 20px; border-radius: 8px; 
      min-width: 400px; max-width: 600px; max-height: 70vh; 
      overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    modalContent.innerHTML = `
      <h3>Edit Tags for Link</h3>
      <p>Select which tags you want to associate with this link:</p>
      <div id="tag_checkboxes" style="margin: 15px 0;">
        ${todasTags.map(tag => `
          <label style="display: block; margin: 8px 0; cursor: pointer;">
            <input type="checkbox" value="${tag.id_tag}" ${idsTagsAtuais.includes(tag.id_tag) ? 'checked' : ''} style="margin-right: 8px;">
            <span>${tag.nome}</span>
          </label>
        `).join('')}
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <button id="cancel_tags" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button id="save_tags" style="padding: 8px 16px; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">Save Tags</button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Event listeners para os botões
    document.getElementById('cancel_tags').onclick = () => {
      document.body.removeChild(modal);
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


async function deletarUsuario() {
  try {
    const response = await fetch("database/api/deleteUser.php", {
      method: "DELETE",
      credentials: "include"
    });

    const data = await response.json();
    alert(data.message);

    if (data.success) {
      window.location.href = "signin.html";
    }
  } catch (err) {
    console.error("Erro ao deletar usuário:", err);
    alert("Erro ao tentar deletar conta.");
  }
}



// ========== AO CARREGAR A PÁGINA ==========
document.addEventListener("DOMContentLoaded", () => {
  mostrarNome();
  mostrarQtdLinks();
  renderizarLinks();
  renderizarTagsUsuario(); // Carregar as tags do usuário
});
