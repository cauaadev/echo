import React from "react";
import { useNavigate } from "react-router-dom";
import "./help.css";

export default function Help() {
    const navigate = useNavigate();

    return (
        <div className="help-page">
            <header className="help-header">
                <h1>Ajuda</h1>
                <button onClick={() => navigate(-1)}>Voltar</button>
            </header>

            <main className="help-content">
                <section className="help-section">
                    <h2>📌 Como usar a plataforma</h2>
                    <ul>
                        <li>Enviar mensagens privadas no chat com outros usuários.</li>
                        <li>Adicionar novos usuários através da barra de pesquisa.</li>
                        <li>Bloquear ou ocultar usuários que você não deseja interagir.</li>
                        <li>Arquivar conversas antigas para organizar o histórico.</li>
                        <li>Acessar ajustes do perfil e personalizar configurações.</li>
                    </ul>
                </section>

                <section className="help-section">
                    <h2>⚠ Problemas comuns</h2>
                    <ul>
                        <li>Não consigo enviar mensagens → verifique sua conexão com a internet.</li>
                        <li>Usuário não aparece → confira filtros ou pesquisa de usuários.</li>
                        <li>Menu de perfil não abre → clique na foto do perfil corretamente.</li>
                    </ul>
                </section>

                <section className="help-section">
                    <h2>💡 Dicas</h2>
                    <ul>
                        <li>Mantenha seu avatar atualizado para melhor identificação.</li>
                        <li>Use conversas arquivadas para limpar sua lista de usuários.</li>
                        <li>Ative notificações para não perder mensagens importantes.</li>
                    </ul>
                </section>
            </main>
        </div>
    );
}
