# Sufalopoly

Monopoly custom, jucabil local cu prietenii prin WiFi.

## Cum pornești

1. Ai nevoie de [Node.js](https://nodejs.org) instalat pe laptop (versiune 18+).
2. Deschide un terminal în acest folder și rulează:
   ```
   npm install
   node server.js
   ```
3. Terminalul îți arată două adrese:
   - `http://localhost:3000` — o folosești tu, pe laptop
   - `http://192.168.x.x:3000` — o trimiți prietenilor. Trebuie să fie pe **aceeași rețea WiFi** (ex. routerul de acasă). Deschid link-ul în orice browser, de pe telefon sau laptop.

## Cum se joacă

1. Un jucător apasă „Creează o cameră nouă" — primește un cod de 4 litere.
2. Ceilalți intră cu „Intră într-o cameră" + codul.
3. Gazda (primul jucător) apasă „Începe jocul" când sunt minim 2 jucători (max 6).
4. La rândul tău: arunci zarurile, cumperi sau nu proprietatea pe care ajungi, apoi „Termină rândul".
5. Poți construi case/hoteluri sau ipoteca proprietăți apăsând pe cartelele de sub „Proprietățile tale".

## Ce e inclus

- Tabla completă (40 de căsuțe) cu numele voastre custom
- Cărțile Șansă și Detectorul lui Dale (community chest) cu textele voastre
- Reguli standard Monopoly: cumpărare, chirii, case/hoteluri (construcție egală pe set), ipotecă, pușcărie (3 încercări sau plată M50 sau cartelă liberă), faliment, câștigător ultimul rămas
- Pot de Parcare Gratuită (taxele se adună acolo)

## Ce NU e încă inclus (pot adăuga dacă vrei)

- Tranzacții/schimburi între jucători (trade)
- Licitație când cineva refuză să cumpere o proprietate
- Reconectare automată dacă cineva pierde conexiunea la mijlocul jocului (poate reintra, dar nu-și recuperează automat locul din UI dacă a dat refresh — de reparat la cerere)

## Notă despre cărțile custom

Câteva mecanici din cărțile "Detectorul lui Dale" (certificatul de handicap, peturile reciclate) sunt implementate simplificat — verifică-le în joc și spune-mi dacă vrei alt comportament.
