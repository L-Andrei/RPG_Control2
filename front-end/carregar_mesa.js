/// ==========================================================
/// ==========  Consultar Mesas ==== ============================
/// ==========================================================


document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("email");
  const userEmailSpan = document.getElementById("userEmail");
  const mensagemDiv = document.getElementById("mensagem");
  const listaMesasDiv = document.getElementById("listaMesas");
  const listaParticipanteDiv = document.getElementById("listaParticipante");

  if (!email) {
    mensagemDiv.textContent = "E-mail do usuário não encontrado.";
    return;
  }

  userEmailSpan.textContent = email;

  const criarCardMesa = (mesa, tipo) => {
    const card = document.createElement("div");
    card.style.border = "1px solid #ccc";
    card.style.borderRadius = "8px";
    card.style.padding = "1rem";
    card.style.marginBottom = "1rem";
    card.style.backgroundColor = "#fdfdfd";

    const titulo = document.createElement("h3");
    titulo.textContent = mesa.nome;

    const descricao = document.createElement("p");
    descricao.textContent = mesa.descricao || "";

    const id = document.createElement("p");
    id.innerHTML = `<strong>ID:</strong> ${mesa.id_mesa}`;

    const botaoIr = document.createElement("button");
    botaoIr.textContent = "Ir para a mesa";
    botaoIr.style.marginTop = "0.5rem";

    botaoIr.addEventListener("click", () => {
      if (tipo === "mestre") {
        localStorage.setItem("mesaMestre", mesa.id_mesa);
        window.location.href = "mesa_mestre.html";
      } else if (tipo === "participante") {
        localStorage.setItem("mesaJogador", mesa.id_mesa);
        window.location.href = "mesa_jogador.html";
      }
    });

    card.appendChild(titulo);
    card.appendChild(descricao);
    card.appendChild(id);
    card.appendChild(botaoIr);

    return card;
  };

  const listarMesas = async () => {
    mensagemDiv.textContent = "Carregando mesas...";

    try {
      const [resMestre, resParticipante] = await Promise.all([
        fetch("https://137.131.168.114:8443/obter_mesa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }),
        fetch("https://137.131.168.114:8443/listar_mesas_participante", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }),
      ]);

      let mesasMestre = [];
      if (resMestre.ok) {
        mesasMestre = await resMestre.json();
      } else if (resMestre.status === 404) {
        mesasMestre = [];
      } else {
        throw new Error("Erro ao carregar mesas como mestre");
      }

      let mesasParticipante = [];
      if (resParticipante.ok) {
        mesasParticipante = await resParticipante.json();
      } else if (resParticipante.status === 404) {
        mesasParticipante = [];
      } else {
        throw new Error("Erro ao carregar mesas como participante");
      }

      // Limpa mensagem de carregamento para não remover o elemento, só limpar texto
      mensagemDiv.textContent = "";

      // Limpa listas antes de preencher (importante para evitar duplicatas se listarMesas rodar novamente)
      listaMesasDiv.textContent = "";
      listaParticipanteDiv.textContent = "";

      if (mesasMestre.length === 0) {
        listaMesasDiv.textContent = "Nenhuma mesa como mestre encontrada.";
      } else {
        mesasMestre.forEach((mesa) => {
          listaMesasDiv.appendChild(criarCardMesa(mesa, "mestre"));
        });
      }

      if (mesasParticipante.length === 0) {
        listaParticipanteDiv.textContent = "Nenhuma mesa como participante encontrada.";
      } else {
        mesasParticipante.forEach((mesa) => {
          listaParticipanteDiv.appendChild(criarCardMesa(mesa, "participante"));
        });
      }
    } catch (error) {
      mensagemDiv.textContent = "Erro ao carregar mesas.";
      console.error(error);
    }
  };

  listarMesas();
});

