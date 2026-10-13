document.addEventListener('DOMContentLoaded', () => {
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.getElemntById('game-board');
    const hudPlayerName = document.getElemntById('hud-player-name');
    const scoreDisplay = document.getElemntById('score-display');
    const jumpTip = document.getElemntById('jump-tip');
    const startModal= document.getElemntById('start-modal');
    const starForm= document.getElemntById('start-form');
    const playerInput= document.getElemntById('player-input');
})

const startModal = document.getElemntById('start-modal');
const starForm = document.getElemntById('start-form');
const playerInput = document.getElemntById('player-input');
const btnViewRanking = document.getElemntById('btn-view-ranking');

const gameoverModal = document.getElemntById('gameover-modal');
const finalScoreValue = document.getElemntById('final-score-value');
const saveStatusMsg = document.getElemntById('ranking-body');
const btnRestart = document.getElemntById('btn-restart');
const btnChangePlayer = document.getElemntById('btn-change-play');

//Variáveis de estado
let currentPlayer = '';
let score = 0;
let isPlaying = false;
let gameLoop = null;
let scoreLoop = null;

//recuperacao do ultimo nome de usuario utilizado
const savedName = localStorage.getItem('mario_jump_player');
if (savedName && playerInput) {
    playerInput.value = savedName;
}

//limpa loops anteriores, caso existam
function startGame() {
    clearInterval(gameLoop);
    clearInterval(scoreLoop);
    // reseta as posicoes atuais
    resetElements(); 

    isPlaying = true;
    score = 0;
    scoreDisplay.textContent = '0';
    hudPlayerName.textContent = currentPlayer || 'Jogador';
    //ativa as animacoes CSS do jogo
    gameBoard.classList.add('running');

    scoreLoop = setInterval(() => {
        if(isPlaying){
            score += 1;
            scoreDisplay.textContent = score;
        }
    }, 100);

    gameLoop = setInterval(checkColision, 10);
}

//funcao para resetar os elementos
function resetElements(){
    pipe.style.animation = '';
    pipe.style.left = '';

    //mario estilo
    mario.src = '../assets/mario.gif'
    mario.style.animation = '';
    mario.style.bottom = '0px';
    mario.style.wid = '';
    mario.style.marginLeft = '';
    mario.classList.remove('jump');

    if(jumpTip){
    jumpTip.style.opacity = '1';
    }
}   

//reseta o mario
function jump(){
    if(!isPlaying) return;
    if(mario.classList.contains('jump')) return;

    mario.classList.add('jump');
    if(jumpTip){
        jumpTip.style.opacity = '0';
    }

    setTimeout(() => {
        mario.classList.remove('jump');
    }, 500);
}

function checkColision(){
    if(!isPlaying) return;
    const pipePosition = pipe.offsetLeft;
    const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

    //tolerancia de colisao
    if(pipePosition <= 120 && pipePosition > 0 && marioPosition < 80){
        triggerGameOver(pipePosition, marioPosition);
    }
}

//tratar o jogo
function triggerGameOver(pipePosition, marioPosition){
    isPlaying = false;
    clearInterval(gameLoop);
    clearInterval(scoreLoop);
    gameBoard.classList.remove('running');

    pipe.style.animation = 'none'; 
    pipe.style.left = `${pipePosition}px`;
    mario.style.animation = 'none';
    mario.style.bottom = `${marioPosition}px`;
    mario.src = '../assets/game-over.png'
    mario.style.width = '75px';
    mario.style.marginLeft = '50px';

    //atualização modal de game over
    finalScoreValue.textContent = score;
    saveStatusMsg.textContent = 'Salvando pontuação no banco...';
    saveStatusMsg.style.color = '#ffcc00';
    gameoverModal.classList.add('active');
    saveScore(currentPlayer, score);//salva a pontucao no banco
}

function saveScore(playerName, finalScore){
    fetch('salvar_ranking.php', {
        metthod: 'POST',
        headers: {
            'Content-Type': 'aplication/json'
        },
        body: JSON.stringify({
            nome: playerName,
            pontos: finalScore
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'sucess'){
            saveStatusMsg.textContent = 'Pontução registrada no banco';
            saveStatusMsg.style.color = '#10b981';
            if(data.ranking){
                renderRanking(data.ranking, playerName, finalScore);
            }
        }  else {
            saveStatusMsg.textContent = (data.message || 'Erro ao registar.');
            saveStatusMsg.style.color = '#ef4444';
        }
    })
    .catch(err => {
        console.error('Erro na requisição', err);
        saveStatusMsg.textContent = 'Erro ao conectar ao servidor.';
        saveStatusMsg.style.color = '#ef4444';
    });
      
}
//Busca no ranking atualizado do banco
function fetchRanking(){
    fetch('obter_ranking.php')
    .then(res => res.json())
    .then(data => {
        if (data.status === 'sucess' && data.ranking){
            renderRanking(data.ranking);
        }
    })
    .catch(err => console.error('Erro ao buscar o ranking', err));
}
//Atualizando a tabela do ranking no html
function renderRanking(list, highlightName = null, highlightScore = null){
    if(!rankingBody) return;
    rankingBody.innerHTML = '';
    if(!list || list.length === 0){
        rankingBody.innerHTML = `<tr><td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda.</td></tr>`; 
        return;
    }
    let highlightted = false;
    list.forEach((item, index) => {
        const tr = document.createElement('tr');

        if(!highlightted && highlightName && item.nome === highlightName && parseInt(item.pontos, 10) === highlightScore){
            tr.classList.add('highlight-current');
            highlightted = true;

        }

        let medal = `${index + 1}º`;
        if(index === 0) medal = '🥇 1º';
        else if (index === 1) medal = '🥈 2º';
        else if (index === 2) medal = '🥉 3º';

        tr.innerHTML = `
            <td class="ranking-pos">${medal}</td>
            <td><strong>${escapeHtml(item.nome)}</strong></td>
            <td>${parseInt(item.pontos, 10)} pts</td>
        `;

        rankingBody.appendChild(tr);

    });
}

function escapeHtml(str){
    if(!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
//inicar o jogo (Formulario)
startForm.addEventListener('submit', (e) =>{
    e.preventDefault();
    
    const nameValue = playerInput.trim();
    if(!nameValue){
        playerInput.focus();
        return;
    }

    currentPlayer = nameValue;
    localStorage.setItem('mario_jump_player', currentPlayer);

    startModal.classList.remove('active');
    startGame();
});