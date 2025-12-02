
import { Municipio } from '../types';

const rawData = {
  "municipios": [
    {
      "editais": [
        {
          "itens": [
            {
              "descricao": "ADITIVO PLASTIFICANTE CONCENTRADO PARA ARGAMASSAS DE ASSENTAMENTO E REBOCO CONVENCIONAL, BALDE COM 18 LITROS",
              "marca": "MAZA",
              "quantidade": 87,
              "unidade": "BLD",
              "valorTotal": 6907.8,
              "valorUnitario": 79.4
            },
            {
              "descricao": "ARAME CONFECCIONADO EM AÇO RECOZIDO TORCIDO, N°18, ROLOS DE 1 KG, COM DIAMETRO MINIMO DE 1.25 MM",
              "marca": "GERDAU",
              "quantidade": 463,
              "unidade": "UN",
              "valorTotal": 4352.2,
              "valorUnitario": 9.4
            },
            {
              "descricao": "ARAME PARAGUAIO 17X15 (2,4 X 3,00 MM) ARAME OVALADO LISO, CONFECCIONADO EM AÇO, ENTREGUE EM ROLOS DE 1.000 METROS, COM PESO APROXIMADO DE 700 QUILOGRAMAS, RESISTENTE A TRAÇAO.",
              "marca": "GERDAU",
              "quantidade": 5,
              "unidade": "UN",
              "valorTotal": 2950,
              "valorUnitario": 590
            },
            {
              "descricao": "AREIA GROSSA LIMPA SEM SUJIDADES, COM GRANULOMETRIA ENTRE 1,20 MM A 4,80 MM.",
              "marca": "PILAREIA",
              "quantidade": 823,
              "unidade": "M³",
              "valorTotal": 106981.77,
              "valorUnitario": 129.99
            },
            {
              "descricao": "ARGAMASSA COLANTE CIMENTICIA, CLASSIFICAÇAO ACI, DESTINADA AO ASSENTAMENTO DE CERAMICAS EM AREAS INTERNAS, EMBALAGENS DE 20 KG",
              "marca": "VOTOMASSA",
              "quantidade": 120,
              "unidade": "UN",
              "valorTotal": 1080,
              "valorUnitario": 9
            },
            {
              "descricao": "ARGAMASSA POLIMERICA SEMIFLEXIVEL IMPERMEAVEL, ENTREGUE EM SACOS DE 12 KG",
              "marca": "SIKA",
              "quantidade": 170,
              "unidade": "UN",
              "valorTotal": 8075,
              "valorUnitario": 47.5
            },
            {
              "descricao": "BACIA SANITARIA CONVENCIONAL NA COR BRANCA",
              "marca": "CELITE",
              "quantidade": 47,
              "unidade": "UN",
              "valorTotal": 7331.0599999999995,
              "valorUnitario": 155.98
            },
            {
              "descricao": "BACIA SANITARIA COM CAIXA ACOPLADA COM FORMATO OVAL, NA COR BRANCA",
              "marca": "INCEPA",
              "quantidade": 15,
              "unidade": "UN",
              "valorTotal": 4050,
              "valorUnitario": 270
            },
            {
              "descricao": "BACIA SANITARIA PARA UTILIZAÇAO INFANTIL COM FORMATO OVAL, NA COR BRANCA.",
              "marca": "CELITE",
              "quantidade": 26,
              "unidade": "UN",
              "valorTotal": 7799.116,
              "valorUnitario": 299.966
            },
            {
              "descricao": "BLOCO CANALETA CERAMICA MODELO U, COM AS DIMENSOES DE 11,50 X 19,00 X 19,00 CM",
              "marca": "CERAMICA ITATUÍ",
              "quantidade": 14000,
              "unidade": "UN",
              "valorTotal": 23332.4,
              "valorUnitario": 1.6666
            },
            {
              "descricao": "BLOCO CANALETA CERAMICA MODELO U, COM AS DIMENSOES DE 14,00 X 19,00 X 19,00 CM",
              "marca": "CERAMICA ITATUÍ",
              "quantidade": 14960,
              "unidade": "UN",
              "valorTotal": 23786.4,
              "valorUnitario": 1.59
            },
            {
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 6 FUROS, COM DIMENSAO DE 14,00 X 24,00 X 9,00 CM",
              "marca": "CERAMICA ITATUÍ",
              "quantidade": 97500,
              "unidade": "UN",
              "valorTotal": 78877.5,
              "valorUnitario": 0.809
            },
            {
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 8 FUROS, COM DIMENSAO DE 19,00 X 19,00 X 9,00 CM",
              "marca": "CERAMICA ITATUÍ",
              "quantidade": 141800,
              "unidade": "UN",
              "valorTotal": 106350,
              "valorUnitario": 0.75
            },
            {
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 9 FUROS NA HORIZONTAL COM AS DIMENSOES DE 11,50X14,00X24,00 CM, PRIMEIRA LINHA, TIPO BAIANO. DEVERA ATENDER A NBR 15.270 E OUTRAS PERTINENTES.",
              "marca": "CERAMICA ITATUÍ",
              "quantidade": 133500,
              "unidade": "UN",
              "valorTotal": 89845.5,
              "valorUnitario": 0.673
            },
            {
              "descricao": "BLOCO CERAMICO MEIA PEÇA PARA VEDAÇAO COM 9 FUROS NA HORIZONTAL COM AS DIMENSOES DE 11,50X14,00X12,00 CMPRIMEIRA LINHA, TIPO BAIANO. DEVERA ATENDER A NBR 15.270 E OUTRAS PERTINENTES.",
              "marca": "CERAMICA ITATUÍ",
              "quantidade": 30000,
              "unidade": "UN",
              "valorTotal": 22800,
              "valorUnitario": 0.76
            },
            {
              "descricao": "CAIXA D'AGUA FABRICADA EM POLIETILENO, COM CAPACIDADE PARA 1.000 LITROS",
              "marca": "FORTLEV",
              "quantidade": 10,
              "unidade": "UN",
              "valorTotal": 3000,
              "valorUnitario": 300
            },
            {
              "descricao": "CAL DE PINTURA, EMBALAGENS DE 8 KG, RENDIMENTO MINIMO DE 60 M²",
              "marca": "QUALYCAL",
              "quantidade": 990,
              "unidade": "SACO",
              "valorTotal": 13365,
              "valorUnitario": 13.5
            },
            {
              "descricao": "CAL HIDRATADA CH-III, SACO COM 20 KG",
              "marca": "QUALY CAL",
              "quantidade": 2856,
              "unidade": "SACO",
              "valorTotal": 35700,
              "valorUnitario": 12.5
            },
            {
              "descricao": "CIMENTO PORTLAND",
              "marca": "VOTORAN",
              "quantidade": 3885,
              "unidade": "SACO",
              "valorTotal": 108741.15,
              "valorUnitario": 27.99
            },
            {
              "descricao": "ESPUMA EXPANSIVA (PU), AEROSSOIS DE 750 ML",
              "marca": "CHEMI COLOR",
              "quantidade": 150,
              "unidade": "UN",
              "valorTotal": 2589.8999999999996,
              "valorUnitario": 17.266
            },
            {
              "descricao": "FECHADURA DE PORTA EXTERNA - 40 MM NA COR CROMADO. MAQUINA COM TAMANHO DE 40 MM, MAÇANETA EM ZAMAC, TESTA E CONTRA TESTA E OUTROS ACESSORIOS DEVERAO SER CONFECCIONADOS EM AÇO INOXIDAVEL. TIPO DE INSTALAÇAO: EMBUTIR.",
              "marca": "3F",
              "quantidade": 28,
              "unidade": "UN",
              "valorTotal": 1203.048,
              "valorUnitario": 42.966
            },
            {
              "descricao": "FECHADURA DE PORTA EXTERNA - 45 MM NA COR CROMADO. MAQUINA COM TAMANHO DE 45 MM, MAÇANETA EM ZAMAC, TESTA E CONTRA TESTA E OUTROS ACESSORIOS DEVERAO SER CONFECCIONADOS EM AÇO INOXIDAVEL. TIPO DE INSTALAÇAO: EMBUTIR",
              "marca": "3F",
              "quantidade": 30,
              "unidade": "UN",
              "valorTotal": 2478,
              "valorUnitario": 82.6
            },
            {
              "descricao": "FECHADURA DE PORTA EXTERNA - 50 MM NA COR CROMADO. MAQUINA COM TAMANHO DE 50 MM, MAÇANETA EM ZAMAC, TESTA E CONTRA TESTA E OUTROS ACESSORIOS DEVERAO SER CONFECCIONADOS EM AÇO INOXIDAVEL. TIPO DE INSTALAÇAO: EMBUTIR",
              "marca": "3F",
              "quantidade": 29,
              "unidade": "UN",
              "valorTotal": 2415.7,
              "valorUnitario": 83.3
            },
            {
              "descricao": "FORRO MODULAR EM PVC, LISO TEXTURIZADO, NA COR BRANCA, ENCAIXE MACHO E FEMEA, DIMENSAO DE 8 MM, 20 CM DE LARGURA",
              "marca": "PLASBIL",
              "quantidade": 470,
              "unidade": "M²",
              "valorTotal": 9023.06,
              "valorUnitario": 19.198
            },
            {
              "descricao": "MANTA LIQUIDA IMPERMEABILIZANTE BRANCA A BASE DE COPOLIMERO ACRILICO EM DISPERSAO AQUOSA E APLICAÇAO A FRIO, SEM EMENDAS, PRONTA PRA USO, COM TEMPO DE SECAGEM DE 4 HORAS ENTRE DEMAOS. DEVERA APRESENTAR PROTEÇAO IMPERMEAVEL E CARACTERISTICAS DE ELASTICIDADE, FLEXIBILIDADE, ADERENCIA E RESISTENCIA AS INTEMPERIES. ECOLOGICAMENTE CORRETO, ISENTO DE AMONIACO E COM AÇAO FUNGICIDA. ENTREGUE EM BALDES DE 18 KG, DEVERA TER RENDIMENTO MINIMO DE 1,8 KG/M² EM AREAS COM REVESTIMENTO CERAMICO E DE 1,2 KG/M² EM AREAS EXPOSTAS. DEVERA ATENDER AS NORMAS TECNICAS PERTINENTES. NOS PADROES DA MARCA VEDACIT OU SIMILAR.",
              "marca": "Multilit",
              "quantidade": 133,
              "unidade": "UN",
              "valorTotal": 29345.386,
              "valorUnitario": 220.642
            },
            {
              "descricao": "PEDRA 1, GRANULOMETRIA MINIMA DE 9,5 A 25 MM",
              "marca": "VOTORANTIM",
              "quantidade": 2937,
              "unidade": "M³",
              "valorTotal": 244258.542,
              "valorUnitario": 83.166
            },
            {
              "descricao": "PEDRA 4 GRANULOMETRIA MINIMA DE 37,5 A 75 MM. DEVERA ATENDER O DISPOSTO NA NBR 7211 E OUTRAS PERTINENTES.",
              "marca": "VOTORANTIM",
              "quantidade": 485,
              "unidade": "M³",
              "valorTotal": 42776.515,
              "valorUnitario": 88.199
            },
            {
              "descricao": "PEDRA OVO DE PATO (SEIXO)",
              "marca": "VOTORANTIM",
              "quantidade": 1479,
              "unidade": "M³",
              "valorTotal": 138480.249,
              "valorUnitario": 93.631
            },
            {
              "descricao": "PEDRA RACHÃO (PULMÃO)",
              "marca": "VOTORANTIM",
              "quantidade": 500,
              "unidade": "M³",
              "valorTotal": 40782,
              "valorUnitario": 81.564
            },
            {
              "descricao": "PEDRISCO MINIMO GRANULOMETRIA MINIMA DE 150 ?M A 12,5MM ABNT 7211:2009",
              "marca": "VOTORANTIM",
              "quantidade": 1917,
              "unidade": "M³",
              "valorTotal": 197928.33299999998,
              "valorUnitario": 103.249
            },
            {
              "descricao": "PO DE PEDRA, GRANULOMETRIA MINIMA DE 150 ?M A 4,75MM ABNT 7211:2009",
              "marca": "PILAREIA",
              "quantidade": 1454,
              "unidade": "M³",
              "valorTotal": 165360.512,
              "valorUnitario": 113.728
            },
            {
              "descricao": "TELA MALHA POP PESADA, 15X15 CM, COM DIAMETRO DE 4,2 MM DESTINADA A CONSTRUÇAO DE LAJES EM CONCRETO ARMADO, PISOS INDUSTRIAIS E OUTROS. CONFECCIONADA EM AÇO CA-60 NERVURADO. DEVERA SER ENTREGUE EM PAINEIS DE DIMENSAO 2 M X 3 M. DEVERA ATENDER O DISPOSTO NA ABNT NBR 7481 E OUTRAS PERTINENTES.",
              "marca": "FRETELA",
              "quantidade": 7,
              "unidade": "UN",
              "valorTotal": 335.965,
              "valorUnitario": 47.995
            },
            {
              "descricao": "TELA MALHA POP PESADA, 20X20 CM, COM DIAMETRO DE 3,4 MM DESTINADA A CONSTRUÇAO DE LAJES EM CONCRETO ARMADO, PISOS INDUSTRIAIS E OUTROS. CONFECCIONADA EM AÇO CA-60 NERVURADO. DEVERA SER ENTREGUE EM PAINEIS DE DIMENSAO 2 M X 3 M. DEVERA ATENDER O DISPOSTO NA ABNT NBR 7481 E OUTRAS PERTINENTES.",
              "marca": "FRETELA",
              "quantidade": 107,
              "unidade": "UN",
              "valorTotal": 3493.0150000000003,
              "valorUnitario": 32.645
            },
            {
              "descricao": "TIJOLO COMUM (MACIÇO). MEDINDO APROXIMADAMENTE 4,5X9,5X19,5 CM, PRIMEIRA LINHA.",
              "marca": "CERAMICA TATUI",
              "quantidade": 138500,
              "unidade": "UN",
              "valorTotal": 59915.1,
              "valorUnitario": 0.4326
            },
            {
              "descricao": "VERGALHAO CA-50 - 3/8, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "marca": "Gerdau",
              "quantidade": 2408,
              "unidade": "UN",
              "valorTotal": 100252.26400000001,
              "valorUnitario": 41.633
            },
            {
              "descricao": "VERGALHAO CA-50 - 1/2, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "marca": "Gerdau",
              "quantidade": 1183,
              "unidade": "UN",
              "valorTotal": 67507.895,
              "valorUnitario": 57.065
            },
            {
              "descricao": "VERGALHAO CA-50 - 1/4, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "marca": "Gerdau",
              "quantidade": 720,
              "unidade": "UN",
              "valorTotal": 16200,
              "valorUnitario": 22.5
            }
          ],
          "nome": "MATERIAL CONSTRUÇÃO",
          "saidas": [
            {
              "data": "08/06/2025",
              "descricao": "CIMENTO PORTLAND",
              "itemIndex": "18",
              "marca": "VOTORAN",
              "notaFiscal": "121",
              "quantidade": 10,
              "valorTotal": 279.9,
              "valorUnitario": 27.99
            },
            {
              "data": "08/06/2025",
              "descricao": "VERGALHAO CA-50 - 3/8, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "itemIndex": "34",
              "marca": "Gerdau",
              "notaFiscal": "121",
              "quantidade": 15,
              "valorTotal": 624.495,
              "valorUnitario": 41.633
            },
            {
              "data": "08/06/2025",
              "descricao": "VERGALHAO CA-50 - 1/2, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "itemIndex": "35",
              "marca": "Gerdau",
              "notaFiscal": "121",
              "quantidade": 15,
              "valorTotal": 855.9749999999999,
              "valorUnitario": 57.065
            },
            {
              "data": "08/06/2025",
              "descricao": "CIMENTO PORTLAND",
              "itemIndex": "18",
              "marca": "VOTORAN",
              "notaFiscal": "122",
              "quantidade": 10,
              "valorTotal": 279.9,
              "valorUnitario": 27.99
            },
            {
              "data": "08/06/2025",
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 9 FUROS NA HORIZONTAL COM AS DIMENSOES DE 11,50X14,00X24,00 CM, PRIMEIRA LINHA, TIPO BAIANO. DEVERA ATENDER A NBR 15.270 E OUTRAS PERTINENTES.",
              "itemIndex": "13",
              "marca": "CERAMICA ITATUÍ",
              "notaFiscal": "123",
              "quantidade": 1500,
              "valorTotal": 1009.5000000000001,
              "valorUnitario": 0.673
            },
            {
              "data": "08/06/2025",
              "descricao": "CAL HIDRATADA CH-III, SACO COM 20 KG",
              "itemIndex": "17",
              "marca": "QUALY CAL",
              "notaFiscal": "123",
              "quantidade": 50,
              "valorTotal": 625,
              "valorUnitario": 12.5
            },
            {
              "data": "08/06/2025",
              "descricao": "CIMENTO PORTLAND",
              "itemIndex": "18",
              "marca": "VOTORAN",
              "notaFiscal": "123",
              "quantidade": 100,
              "valorTotal": 2799,
              "valorUnitario": 27.99
            },
            {
              "data": "08/06/2025",
              "descricao": "VERGALHAO CA-50 - 3/8, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "itemIndex": "34",
              "marca": "Gerdau",
              "notaFiscal": "123",
              "quantidade": 50,
              "valorTotal": 2081.65,
              "valorUnitario": 41.633
            },
            {
              "data": "08/06/2025",
              "descricao": "VERGALHAO CA-50 - 1/2, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "itemIndex": "35",
              "marca": "Gerdau",
              "notaFiscal": "123",
              "quantidade": 50,
              "valorTotal": 2853.25,
              "valorUnitario": 57.065
            },
            {
              "data": "17/06/2025",
              "descricao": "ADITIVO PLASTIFICANTE CONCENTRADO PARA ARGAMASSAS DE ASSENTAMENTO E REBOCO CONVENCIONAL, BALDE COM 18 LITROS",
              "itemIndex": "0",
              "marca": "MAZA",
              "notaFiscal": "126",
              "quantidade": 3,
              "valorTotal": 238.20000000000002,
              "valorUnitario": 79.4
            },
            {
              "data": "17/06/2025",
              "descricao": "ARAME CONFECCIONADO EM AÇO RECOZIDO TORCIDO, N°18, ROLOS DE 1 KG, COM DIAMETRO MINIMO DE 1.25 MM",
              "itemIndex": "1",
              "marca": "GERDAU",
              "notaFiscal": "126",
              "quantidade": 5,
              "valorTotal": 47,
              "valorUnitario": 9.4
            },
            {
              "data": "17/06/2025",
              "descricao": "CIMENTO PORTLAND",
              "itemIndex": "18",
              "marca": "VOTORAN",
              "notaFiscal": "126",
              "quantidade": 15,
              "valorTotal": 419.84999999999997,
              "valorUnitario": 27.99
            },
            {
              "data": "17/06/2025",
              "descricao": "MANTA LIQUIDA IMPERMEABILIZANTE BRANCA A BASE DE COPOLIMERO ACRILICO EM DISPERSAO AQUOSA E APLICAÇAO A FRIO, SEM EMENDAS, PRONTA PRA USO, COM TEMPO DE SECAGEM DE 4 HORAS ENTRE DEMAOS. DEVERA APRESENTAR PROTEÇAO IMPERMEAVEL E CARACTERISTICAS DE ELASTICIDADE, FLEXIBILIDADE, ADERENCIA E RESISTENCIA AS INTEMPERIES. ECOLOGICAMENTE CORRETO, ISENTO DE AMONIACO E COM AÇAO FUNGICIDA. ENTREGUE EM BALDES DE 18 KG, DEVERA TER RENDIMENTO MINIMO DE 1,8 KG/M² EM AREAS COM REVESTIMENTO CERAMICO E DE 1,2 KG/M² EM AREAS EXPOSTAS. DEVERA ATENDER AS NORMAS TECNICAS PERTINENTES. NOS PADROES DA MARCA VEDACIT OU SIMILAR.",
              "itemIndex": "24",
              "marca": "Multilit",
              "notaFiscal": "126",
              "quantidade": 3,
              "valorTotal": 661.9259999999999,
              "valorUnitario": 220.642
            },
            {
              "data": "17/06/2025",
              "descricao": "VERGALHAO CA-50 - 3/8, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "itemIndex": "34",
              "marca": "Gerdau",
              "notaFiscal": "126",
              "quantidade": 6,
              "valorTotal": 249.798,
              "valorUnitario": 41.633
            },
            {
              "data": "17/06/2025",
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 8 FUROS, COM DIMENSAO DE 19,00 X 19,00 X 9,00 CM",
              "itemIndex": "12",
              "marca": "CERAMICA ITATUÍ",
              "notaFiscal": "126",
              "quantidade": 450,
              "valorTotal": 337.5,
              "valorUnitario": 0.75
            },
            {
              "data": "07/07/2025",
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 8 FUROS, COM DIMENSAO DE 19,00 X 19,00 X 9,00 CM",
              "itemIndex": 12,
              "marca": "CERAMICA ITATUÍ",
              "notaFiscal": "131",
              "quantidade": 1800,
              "valorTotal": 1350,
              "valorUnitario": 0.75
            },
            {
              "data": "07/07/2025",
              "descricao": "AREIA GROSSA LIMPA SEM SUJIDADES, COM GRANULOMETRIA ENTRE 1,20 MM A 4,80 MM.",
              "itemIndex": 3,
              "marca": "PILAREIA",
              "notaFiscal": "131",
              "quantidade": 11,
              "valorTotal": 1429.89,
              "valorUnitario": 129.99
            },
            {
              "data": "07/07/2025",
              "descricao": "PEDRA OVO DE PATO (SEIXO)",
              "itemIndex": 27,
              "marca": "VOTORANTIM",
              "notaFiscal": "131",
              "quantidade": 5,
              "valorTotal": 468.155,
              "valorUnitario": 93.631
            },
            {
              "data": "07/07/2025",
              "descricao": "PEDRA 1, GRANULOMETRIA MINIMA DE 9,5 A 25 MM",
              "itemIndex": 25,
              "marca": "VOTORANTIM",
              "notaFiscal": "131",
              "quantidade": 6,
              "valorTotal": 498.996,
              "valorUnitario": 83.166
            },
            {
              "data": "07/07/2025",
              "descricao": "CIMENTO PORTLAND",
              "itemIndex": 18,
              "marca": "VOTORAN",
              "notaFiscal": "131",
              "quantidade": 208,
              "valorTotal": 5821.92,
              "valorUnitario": 27.99
            },
            {
              "data": "07/07/2025",
              "descricao": "AREIA GROSSA LIMPA SEM SUJIDADES, COM GRANULOMETRIA ENTRE 1,20 MM A 4,80 MM.",
              "itemIndex": 3,
              "marca": "PILAREIA",
              "notaFiscal": "133",
              "quantidade": 18,
              "valorTotal": 2339.82,
              "valorUnitario": 129.99
            },
            {
              "data": "07/07/2025",
              "descricao": "ARGAMASSA COLANTE CIMENTICIA, CLASSIFICAÇAO ACI, DESTINADA AO ASSENTAMENTO DE CERAMICAS EM AREAS INTERNAS, EMBALAGENS DE 20 KG",
              "itemIndex": 4,
              "marca": "VOTOMASSA",
              "notaFiscal": "133",
              "quantidade": 10,
              "valorTotal": 90,
              "valorUnitario": 9
            },
            {
              "data": "07/07/2025",
              "descricao": "BACIA SANITARIA CONVENCIONAL NA COR BRANCA",
              "itemIndex": 6,
              "marca": "CELITE",
              "notaFiscal": "133",
              "quantidade": 3,
              "valorTotal": 467.93999999999994,
              "valorUnitario": 155.98
            },
            {
              "data": "07/07/2025",
              "descricao": "BACIA SANITARIA COM CAIXA ACOPLADA COM FORMATO OVAL, NA COR BRANCA",
              "itemIndex": 7,
              "marca": "INCEPA",
              "notaFiscal": "133",
              "quantidade": 1,
              "valorTotal": 270,
              "valorUnitario": 270
            },
            {
              "data": "07/07/2025",
              "descricao": "BACIA SANITARIA PARA UTILIZAÇAO INFANTIL COM FORMATO OVAL, NA COR BRANCA.",
              "itemIndex": 8,
              "marca": "CELITE",
              "notaFiscal": "133",
              "quantidade": 4,
              "valorTotal": 1199.864,
              "valorUnitario": 299.966
            },
            {
              "data": "07/07/2025",
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 9 FUROS NA HORIZONTAL COM AS DIMENSOES DE 11,50X14,00X24,00 CM, PRIMEIRA LINHA, TIPO BAIANO. DEVERA ATENDER A NBR 15.270 E OUTRAS PERTINENTES.",
              "itemIndex": 13,
              "marca": "CERAMICA ITATUÍ",
              "notaFiscal": "133",
              "quantidade": 2000,
              "valorTotal": 1346,
              "valorUnitario": 0.673
            },
            {
              "data": "07/07/2025",
              "descricao": "CIMENTO PORTLAND",
              "itemIndex": 18,
              "marca": "VOTORAN",
              "notaFiscal": "133",
              "quantidade": 100,
              "valorTotal": 2799,
              "valorUnitario": 27.99
            },
            {
              "data": "07/07/2025",
              "descricao": "FECHADURA DE PORTA EXTERNA - 40 MM NA COR CROMADO. MAQUINA COM TAMANHO DE 40 MM, MAÇANETA EM ZAMAC, TESTA E CONTRA TESTA E OUTROS ACESSORIOS DEVERAO SER CONFECCIONADOS EM AÇO INOXIDAVEL. TIPO DE INSTALAÇAO: EMBUTIR.",
              "itemIndex": 20,
              "marca": "3F",
              "notaFiscal": "133",
              "quantidade": 2,
              "valorTotal": 85.932,
              "valorUnitario": 42.966
            },
            {
              "data": "07/07/2025",
              "descricao": "FECHADURA DE PORTA EXTERNA - 50 MM NA COR CROMADO. MAQUINA COM TAMANHO DE 50 MM, MAÇANETA EM ZAMAC, TESTA E CONTRA TESTA E OUTROS ACESSORIOS DEVERAO SER CONFECCIONADOS EM AÇO INOXIDAVEL. TIPO DE INSTALAÇAO: EMBUTIR",
              "itemIndex": 22,
              "marca": "3F",
              "notaFiscal": "133",
              "quantidade": 1,
              "valorTotal": 83.3,
              "valorUnitario": 83.3
            },
            {
              "data": "07/07/2025",
              "descricao": "FORRO MODULAR EM PVC, LISO TEXTURIZADO, NA COR BRANCA, ENCAIXE MACHO E FEMEA, DIMENSAO DE 8 MM, 20 CM DE LARGURA",
              "itemIndex": 23,
              "marca": "PLASBIL",
              "notaFiscal": "133",
              "quantidade": 30,
              "valorTotal": 575.94,
              "valorUnitario": 19.198
            },
            {
              "data": "07/07/2025",
              "descricao": "TIJOLO COMUM (MACIÇO). MEDINDO APROXIMADAMENTE 4,5X9,5X19,5 CM, PRIMEIRA LINHA.",
              "itemIndex": 33,
              "marca": "CERAMICA TATUI",
              "notaFiscal": "133",
              "quantidade": 1500,
              "valorTotal": 648.9,
              "valorUnitario": 0.4326
            },
            {
              "data": "07/07/2025",
              "descricao": "VERGALHAO CA-50 - 3/8, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "itemIndex": 34,
              "marca": "Gerdau",
              "notaFiscal": "133",
              "quantidade": 30,
              "valorTotal": 1248.99,
              "valorUnitario": 41.633
            },
            {
              "data": "07/07/2025",
              "descricao": "VERGALHAO CA-50 - 1/2, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "itemIndex": 35,
              "marca": "Gerdau",
              "notaFiscal": "133",
              "quantidade": 10,
              "valorTotal": 570.65,
              "valorUnitario": 57.065
            },
            {
              "data": "07/07/2025",
              "descricao": "CAL DE PINTURA, EMBALAGENS DE 8 KG, RENDIMENTO MINIMO DE 60 M²",
              "itemIndex": 16,
              "marca": "QUALYCAL",
              "notaFiscal": "133",
              "quantidade": 10,
              "valorTotal": 135,
              "valorUnitario": 13.5
            },
            {
              "data": "07/07/2025",
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 6 FUROS, COM DIMENSAO DE 14,00 X 24,00 X 9,00 CM",
              "itemIndex": 11,
              "marca": "CERAMICA ITATUÍ",
              "notaFiscal": "133",
              "quantidade": 1000,
              "valorTotal": 809,
              "valorUnitario": 0.809
            },
            {
              "data": "07/07/2025",
              "descricao": "PEDRISCO MINIMO GRANULOMETRIA MINIMA DE 150 ?M A 12,5MM ABNT 7211:2009",
              "itemIndex": 29,
              "marca": "VOTORANTIM",
              "notaFiscal": "133",
              "quantidade": 5,
              "valorTotal": 516.245,
              "valorUnitario": 103.249
            },
            {
              "data": "07/07/2025",
              "descricao": "PEDRA 1, GRANULOMETRIA MINIMA DE 9,5 A 25 MM",
              "itemIndex": "25",
              "marca": "VOTORANTIM",
              "notaFiscal": "133",
              "quantidade": 7,
              "valorTotal": 582.162,
              "valorUnitario": 83.166
            },
            {
              "data": "07/07/2025",
              "descricao": "PEDRA 4 GRANULOMETRIA MINIMA DE 37,5 A 75 MM. DEVERA ATENDER O DISPOSTO NA NBR 7211 E OUTRAS PERTINENTES.",
              "itemIndex": "26",
              "marca": "VOTORANTIM",
              "notaFiscal": "133",
              "quantidade": 10,
              "valorTotal": 881.99,
              "valorUnitario": 88.199
            },
            {
              "data": "07/07/2025",
              "descricao": "ARAME PARAGUAIO 17X15 (2,4 X 3,00 MM) ARAME OVALADO LISO, CONFECCIONADO EM AÇO, ENTREGUE EM ROLOS DE 1.000 METROS, COM PESO APROXIMADO DE 700 QUILOGRAMAS, RESISTENTE A TRAÇAO.",
              "itemIndex": "2",
              "marca": "GERDAU",
              "notaFiscal": "134",
              "quantidade": 2,
              "valorTotal": 1180,
              "valorUnitario": 590
            },
            {
              "data": "07/07/2025",
              "descricao": "AREIA GROSSA LIMPA SEM SUJIDADES, COM GRANULOMETRIA ENTRE 1,20 MM A 4,80 MM.",
              "itemIndex": "3",
              "marca": "PILAREIA",
              "notaFiscal": "134",
              "quantidade": 5,
              "valorTotal": 649.95,
              "valorUnitario": 129.99
            },
            {
              "data": "07/07/2025",
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 6 FUROS, COM DIMENSAO DE 14,00 X 24,00 X 9,00 CM",
              "itemIndex": "11",
              "marca": "CERAMICA ITATUÍ",
              "notaFiscal": "134",
              "quantidade": 1500,
              "valorTotal": 1213.5,
              "valorUnitario": 0.809
            },
            {
              "data": "07/07/2025",
              "descricao": "CAL HIDRATADA CH-III, SACO COM 20 KG",
              "itemIndex": "17",
              "marca": "QUALY CAL",
              "notaFiscal": "134",
              "quantidade": 10,
              "valorTotal": 125,
              "valorUnitario": 12.5
            },
            {
              "data": "07/07/2025",
              "descricao": "CIMENTO PORTLAND",
              "itemIndex": "18",
              "marca": "VOTORAN",
              "notaFiscal": "134",
              "quantidade": 30,
              "valorTotal": 839.6999999999999,
              "valorUnitario": 27.99
            },
            {
              "data": "07/07/2025",
              "descricao": "PEDRISCO MINIMO GRANULOMETRIA MINIMA DE 150 ?M A 12,5MM ABNT 7211:2009",
              "itemIndex": "29",
              "marca": "VOTORANTIM",
              "notaFiscal": "134",
              "quantidade": 5,
              "valorTotal": 516.245,
              "valorUnitario": 103.249
            },
            {
              "data": "07/07/2025",
              "descricao": "VERGALHAO CA-50 - 1/2, BARRAS DE 12 METROS, PESO DE 7,4 KG",
              "itemIndex": "35",
              "marca": "Gerdau",
              "notaFiscal": "134",
              "quantidade": 20,
              "valorTotal": 1141.3,
              "valorUnitario": 57.065
            },
            {
              "data": "07/07/2025",
              "descricao": "ARAME CONFECCIONADO EM AÇO RECOZIDO TORCIDO, N°18, ROLOS DE 1 KG, COM DIAMETRO MINIMO DE 1.25 MM",
              "itemIndex": "1",
              "marca": "GERDAU",
              "notaFiscal": "132",
              "quantidade": 10,
              "valorTotal": 94,
              "valorUnitario": 9.4
            },
            {
              "data": "07/07/2025",
              "descricao": "AREIA GROSSA LIMPA SEM SUJIDADES, COM GRANULOMETRIA ENTRE 1,20 MM A 4,80 MM.",
              "itemIndex": "3",
              "marca": "PILAREIA",
              "notaFiscal": "132",
              "quantidade": 10,
              "valorTotal": 1299.9,
              "valorUnitario": 129.99
            },
            {
              "data": "07/07/2025",
              "descricao": "ARGAMASSA COLANTE CIMENTICIA, CLASSIFICAÇAO ACI, DESTINADA AO ASSENTAMENTO DE CERAMICAS EM AREAS INTERNAS, EMBALAGENS DE 20 KG",
              "itemIndex": "4",
              "marca": "VOTOMASSA",
              "notaFiscal": "132",
              "quantidade": 5,
              "valorTotal": 45,
              "valorUnitario": 9
            },
            {
              "data": "07/07/2025",
              "descricao": "ARGAMASSA POLIMERICA SEMIFLEXIVEL IMPERMEAVEL, ENTREGUE EM SACOS DE 12 KG",
              "itemIndex": "5",
              "marca": "SIKA",
              "notaFiscal": "132",
              "quantidade": 5,
              "valorTotal": 237.5,
              "valorUnitario": 47.5
            },
            {
              "data": "07/07/2025",
              "descricao": "BLOCO CERAMICO PARA VEDAÇAO COM 9 FUROS NA HORIZONTAL COM AS DIMENSOES DE 11,50X14,00X24,00 CM, PRIMEIRA LINHA, TIPO BAIANO. DEVERA ATENDER A NBR 15.270 E OUTRAS PERTINENTES.",
              "itemIndex": "13",
              "marca": "CERAMICA ITATUÍ",
              "notaFiscal": "132",
              "quantidade": 4000,
              "valorTotal": 2692,
              "valorUnitario": 0.673
            },
            {
              "data": "07/07/2025",
              "descricao": "MANTA LIQUIDA IMPERMEABILIZANTE BRANCA A BASE DE COPOLIMERO ACRILICO EM DISPERSAO AQUOSA E APLICAÇAO A FRIO, SEM EMENDAS, PRONTA PRA USO, COM TEMPO DE SECAGEM DE 4 HORAS ENTRE DEMAOS. DEVERA APRESENTAR PROTEÇAO IMPERMEAVEL E CARACTERISTICAS DE ELASTICIDADE, FLEXIBILIDADE, ADERENCIA E RESISTENCIA AS INTEMPERIES. ECOLOGICAMENTE CORRETO, ISENTO DE AMONIACO E COM AÇAO FUNGICIDA. ENTREGUE EM BALDES DE 18 KG, DEVERA TER RENDIMENTO MINIMO DE 1,8 KG/M² EM AREAS COM REVESTIMENTO CERAMICO E DE 1,2 KG/M² EM AREAS EXPOSTAS. DEVERA ATENDER AS NORMAS TECNICAS PERTINENTES. NOS PADROES DA MARCA VEDACIT OU SIMILAR.",
              "itemIndex": "24",
              "marca": "Multilit",
              "notaFiscal": "132",
              "quantidade": 8,
              "valorTotal": 1765.136,
              "valorUnitario": 220.642
            },
            {
              "data": "07/07/2025",
              "descricao": "PEDRA 1, GRANULOMETRIA MINIMA DE 9,5 A 25 MM",
              "itemIndex": "25",
              "marca": "VOTORANTIM",
              "notaFiscal": "132",
              "quantidade": 10,
              "valorTotal": 831.66,
              "valorUnitario": 83.166
            }
          ]
        }
      ],
      "nome": "ITAPUI"
    }
  ]
};

// Generate IDs and ensure types are correct
let itemIdCounter = 0;
let saidaIdCounter = 0;
let editalIdCounter = 0;
let municipioIdCounter = 0;

export const materiaisBackupData: Municipio[] = rawData.municipios.map(municipio => ({
    id: `mun-${municipioIdCounter++}`,
    nome: (municipio as any).nome,
    editais: municipio.editais.map(edital => ({
        id: `edital-${editalIdCounter++}`,
        nome: edital.nome,
        itens: edital.itens.map(item => ({
            ...item,
            id: `item-${itemIdCounter++}`
        })),
        saidas: (edital.saidas as any[]).map(saida => ({
            ...saida,
            id: `saida-${saidaIdCounter++}`,
            // FIX: Ensure 'itemIndex' is always a number.
            itemIndex: typeof saida.itemIndex === 'string' ? parseInt(saida.itemIndex, 10) : saida.itemIndex
        }))
    }))
}));