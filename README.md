RPG Manager – Sistema de Gerenciamento de Mesas de RPG

RPG Manager é um sistema web desenvolvido para facilitar a organização de mesas de RPG, permitindo a gestão de campanhas, personagens, sessões e jogadores de forma centralizada.

O projeto foi implementado em duas máquinas virtuais da Oracle Cloud Infrastructure (OCI), com separação entre backend e frontend para melhorar a estrutura, o desempenho e a escalabilidade do sistema.
Visão Geral

Este sistema tem como objetivo oferecer uma plataforma simples e acessível para mestres e jogadores organizarem suas campanhas de RPG. Ele permite o gerenciamento completo de mesas, personagens, jogadores e sessões.

Funcionalidades principais

    Cadastro de campanhas e mesas

    Criação e edição de fichas de personagens

    Organização de campanhas e mesas.

Arquitetura do Projeto

A aplicação está distribuída entre duas máquinas da Oracle Cloud:

Máquina 1 – Backend

    Servidor: Flask (Python)


    Comunicação segura com o banco de dados MariaDB via Tunel SSH

    O backend se comunica com o usúario via SSH.

Máquina 2 – Frontend e BD

    Servidor: Apache HTTP Server

    Conteúdo: HTML, CSS e JavaScript estáticos

    Interface do usuário que consome a API do backend via chamadas HTTP

    Hospedagem simples e eficiente de arquivos estáticos

    Não se comunica diratamente com o backend, mas envia os scripts necessarios para o usuário.

    Banco de dados: MariaDB.

O ip do servidor frontend é 164.152.36.34 e o ip do backend é 137.131.168.114;

As portas usadas pelos servidores é 443(servidor apache), 8443(backend em Python Flask) e 22(Túnel SSH para o Banco de dados);

Autores: Lucas Andrei Cancelier Marin e Giovani Zanella.