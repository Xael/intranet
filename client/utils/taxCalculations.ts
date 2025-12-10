
import { Product, InvoiceTotals, CRT, GlobalValues } from '../types';

export const calculateItemTax = (
  quantity: number, 
  unitPrice: number, 
  crt: CRT,
  taxInput: any // Partial Tax Input from Form
) => {
  const vProd = quantity * unitPrice;
  
  let vBC = 0;
  let vICMS = 0;
  let vBCPis = 0;
  let vPis = 0;
  let vBCCofins = 0;
  let vCofins = 0;
  let vBCIpi = 0;
  let vIpi = 0;

  // 1. ICMS Calculation
  if (crt === '3' || crt === '2') {
    // Normal Regime or Simples Excesso
    if (['00', '20', '90'].includes(taxInput.cst)) {
        vBC = vProd;
        vICMS = vBC * (taxInput.aliquotaIcms / 100);
    }
  }

  // 2. PIS/COFINS Calculation
  if (['01', '02'].includes(taxInput.cstPis)) {
      vBCPis = vProd;
      vPis = vBCPis * (taxInput.aliquotaPis / 100);
  }
  if (['01', '02'].includes(taxInput.cstCofins)) {
      vBCCofins = vProd;
      vCofins = vBCCofins * (taxInput.aliquotaCofins / 100);
  }

  // 3. IPI Calculation
  if (['00', '49', '50', '99'].includes(taxInput.cstIpi)) {
      vBCIpi = vProd;
      vIpi = vBCIpi * ((taxInput.aliquotaIpi || 0) / 100);
  }

  return {
    baseCalculoIcms: vBC,
    valorIcms: vICMS,
    baseCalculoPis: vBCPis,
    valorPis: vPis,
    baseCalculoCofins: vBCCofins,
    valorCofins: vCofins,
    baseCalculoIpi: vBCIpi,
    valorIpi: vIpi,
    valorTotal: vProd
  };
};

export const calculateInvoiceTotals = (products: Product[], globals?: GlobalValues): InvoiceTotals => {
  const productsTotal = products.reduce((acc, curr) => {
    return {
      vBC: acc.vBC + (curr.tax.baseCalculoIcms || 0),
      vICMS: acc.vICMS + (curr.tax.valorIcms || 0),
      vProd: acc.vProd + curr.valorTotal,
      vIPI: acc.vIPI + (curr.tax.valorIpi || 0),
      vPIS: acc.vPIS + (curr.tax.valorPis || 0),
      vCOFINS: acc.vCOFINS + (curr.tax.valorCofins || 0),
    };
  }, {
    vBC: 0, vICMS: 0, vProd: 0, vIPI: 0, vPIS: 0, vCOFINS: 0
  });

  const vFrete = globals?.frete || 0;
  const vSeg = globals?.seguro || 0;
  const vDesc = globals?.desconto || 0;
  const vOutro = globals?.outrasDespesas || 0;

  // Formula: Total Produtos + IPI + Frete + Seguro + Outro - Desconto
  // Note: ST (Substituição Tributária) is missing here for simplicity, but would be added here
  const vNF = productsTotal.vProd + productsTotal.vIPI + vFrete + vSeg + vOutro - vDesc;

  return {
      ...productsTotal,
      vFrete,
      vSeg,
      vDesc,
      vOutro,
      vNF: Math.max(0, vNF) // Prevent negative total
  };
};
