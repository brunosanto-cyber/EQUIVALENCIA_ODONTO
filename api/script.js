document.getElementById('form-equiparacao').addEventListener('submit', async function(e) {
    e.preventDefault();

    // 1. Pega os dados do formulário
    const operadora = document.getElementById('operadora').value;
    const modelo = document.getElementById('modelo').value;
    const plano = document.getElementById('plano').value;

    // 2. Elementos de UI
    const btn = document.getElementById('btn-submit');
    const loading = document.getElementById('loading');
    const resultadoDiv = document.getElementById('resultado');

    // 3. Prepara a tela para carregar
    btn.disabled = true;
    loading.classList.remove('hidden');
    resultadoDiv.classList.add('hidden');

    try {
        // ATENÇÃO: SUBSTITUA A URL ABAIXO PELA URL DA SUA VERCEL
        const URL_DA_VERCEL = "https://SEU-PROJETO-AQUI.vercel.app/api/comparar";
        
        const resposta = await fetch(URL_DA_VERCEL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ operadora, modelo, plano })
        });

        if (!resposta.ok) {
            throw new Error("Erro na comunicação com a API");
        }

        // 4. Recebe o JSON estruturado que criamos no Back-end
        const dados = await resposta.json();

        // 5. Preenche os dados na tela
        document.getElementById('res-plano-unimed').innerText = dados.plano_unimed;
        document.getElementById('res-percentual').innerText = dados.percentual_equiparacao + "%";
        document.getElementById('res-argumento').innerText = dados.resumo_estrategico;

        // Limpa as listas antigas
        const listaIguais = document.getElementById('lista-iguais');
        const listaDiferentes = document.getElementById('lista-diferentes');
        listaIguais.innerHTML = '';
        listaDiferentes.innerHTML = '';

        // Preenche a lista de coberturas iguais
        dados.coberturas_iguais.forEach(item => {
            const li = document.createElement('li');
            li.innerText = item;
            listaIguais.appendChild(li);
        });

        // Preenche a lista de coberturas diferentes
        dados.coberturas_diferentes.forEach(item => {
            const li = document.createElement('li');
            li.innerText = item;
            listaDiferentes.appendChild(li);
        });

        // 6. Mostra o resultado final com as cores da Unimed
        resultadoDiv.classList.remove('hidden');

    } catch (error) {
        alert("Ocorreu um erro ao processar a equiparação. Tente novamente.");
        console.error(error);
    } finally {
        // Volta o botão ao normal
        btn.disabled = false;
        loading.classList.add('hidden');
    }
});
