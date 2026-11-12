<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased overflow-x-hidden pb-20 lg:pb-0">
    <main class="max-w-[1520px] mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <!-- Cabecera -->
      <div class="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#1d1d1f] text-[#d4b06a] flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[28px]">account_balance</span>
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">
                Estado de Pérdidas y Ganancias (PyG) por Canal
              </h1>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#b08d57]/15 text-[#8a6d3d] border border-[#b08d57]/30">
                Dirección Financiera & Gerencia
              </span>
            </div>
            <p class="text-xs sm:text-sm text-[#86868b] mt-0.5">
              Prorrateo proporcional por ventas netas · Corte mensual y acumulado YTD · Alertas tempranas por rentabilidad negativa
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <input
            v-model="selectedMonth"
            type="month"
            data-testid="pyg-month-input"
            class="px-3 py-2 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs font-bold outline-none focus:border-[#b08d57]"
          />

          <div class="flex items-center bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl p-1 gap-1">
            <button
              type="button"
              data-testid="pyg-mode-monthly"
              @click="viewScope = 'monthly'"
              :class="['px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer', viewScope === 'monthly' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#86868b]']"
            >
              Corte Mensual
            </button>
            <button
              type="button"
              data-testid="pyg-mode-ytd"
              @click="viewScope = 'ytd'"
              :class="['px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer', viewScope === 'ytd' ? 'bg-white text-[#1d1d1f] shadow-xs' : 'text-[#86868b]']"
            >
              Acumulado YTD
            </button>
          </div>

          <button
            type="button"
            @click="showCsvModal = true"
            data-testid="open-csv-modal-btn"
            class="px-3.5 py-2 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5ea] border border-[#e5e5ea] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Importar CSV</span>
          </button>

          <button
            type="button"
            @click="showEntryModal = true"
            data-testid="open-entry-modal-btn"
            class="px-3.5 py-2 rounded-xl bg-[#1d1d1f] hover:bg-[#3a3a3c] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">add</span>
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      <!-- Banner de Alerta Temprana por Pérdida -->
      <div
        v-if="activeSlice.loss_channels.length > 0"
        data-testid="pyg-loss-alert-banner"
        class="bg-[#fff5f5] border border-[#ff3b30]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-[#d70015] text-[24px] mt-0.5">warning</span>
          <div>
            <h3 class="text-sm font-bold text-[#c62828]">
              Alerta de Rentabilidad Negativa ({{ activeSlice.loss_channels.length }} {{ activeSlice.loss_channels.length === 1 ? 'canal en pérdida' : 'canales en pérdida' }})
            </h3>
            <p class="text-xs text-[#7f1d1d] mt-0.5">
              Canales con Margen Neto &lt; 0% o EBITDA negativo:
              <strong>{{ activeSlice.loss_channels.map(c => `${c.name} (${c.net_margin_pct}%, EBITDA ${formatMoney(c.ebitda)})`).join(' · ') }}</strong>
            </p>
          </div>
        </div>
        <span class="text-[11px] font-bold px-3 py-1 rounded-full bg-[#ff3b30] text-white shrink-0">
          Notificado a Dirección Financiera y Gerencia
        </span>
      </div>

      <!-- KPIs Consolidados -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="bg-white rounded-2xl border border-[#e5e5ea] p-4">
          <p class="text-[11px] font-bold uppercase text-[#86868b]">Ventas Netas</p>
          <p class="text-xl font-black text-[#1d1d1f] mt-1" data-testid="cons-net-revenue">{{ formatMoney(activeSlice.consolidated.net_revenue) }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#e5e5ea] p-4">
          <p class="text-[11px] font-bold uppercase text-[#86868b]">Utilidad Bruta</p>
          <p class="text-xl font-black text-[#1d1d1f] mt-1">{{ formatMoney(activeSlice.consolidated.gross_profit) }}</p>
          <span class="text-[11px] font-semibold text-[#5e6c84]">Margen: {{ activeSlice.consolidated.gross_margin_pct }}%</span>
        </div>
        <div class="bg-white rounded-2xl border border-[#e5e5ea] p-4">
          <p class="text-[11px] font-bold uppercase text-[#86868b]">Indirectos Prorrateados</p>
          <p class="text-xl font-black text-[#1d1d1f] mt-1">{{ formatMoney(activeSlice.total_indirect_expenses) }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-[#e5e5ea] p-4">
          <p class="text-[11px] font-bold uppercase text-[#86868b]">EBITDA Consolidado</p>
          <p class="text-xl font-black mt-1" :class="activeSlice.consolidated.ebitda < 0 ? 'text-[#d70015]' : 'text-[#248a3d]'" data-testid="cons-ebitda">
            {{ formatMoney(activeSlice.consolidated.ebitda) }}
          </p>
          <span class="text-[11px] font-semibold text-[#5e6c84]">Margen EBITDA: {{ activeSlice.consolidated.ebitda_margin_pct }}%</span>
        </div>
        <div class="bg-white rounded-2xl border border-[#e5e5ea] p-4">
          <p class="text-[11px] font-bold uppercase text-[#86868b]">Utilidad Neta</p>
          <p class="text-xl font-black mt-1" :class="activeSlice.consolidated.net_income < 0 ? 'text-[#d70015]' : 'text-[#248a3d]'" data-testid="cons-net-income">
            {{ formatMoney(activeSlice.consolidated.net_income) }}
          </p>
          <span class="text-[11px] font-bold" :class="activeSlice.consolidated.net_margin_pct < 0 ? 'text-[#d70015]' : 'text-[#248a3d]'">
            Margen Neto: {{ activeSlice.consolidated.net_margin_pct }}%
          </span>
        </div>
      </div>

      <!-- Tabla PyG Desglosada por Canal -->
      <div class="bg-white rounded-3xl border border-[#e5e5ea] shadow-xs overflow-hidden">
        <div class="px-6 py-4 border-b border-[#e5e5ea] bg-[#fbfbfd] flex items-center justify-between">
          <h2 class="text-sm font-bold text-[#1d1d1f]">
            Estado de Resultados por Canal — {{ viewScope === 'monthly' ? `Mes ${selectedMonth}` : `Acumulado YTD (${report?.ytd_range || selectedMonth})` }}
          </h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#f5f5f7] text-[#86868b] uppercase text-[10px] font-bold">
              <tr>
                <th class="px-4 py-3">Canal</th>
                <th class="px-4 py-3 text-right">Ventas Netas</th>
                <th class="px-4 py-3 text-right">% Part.</th>
                <th class="px-4 py-3 text-right">COGS</th>
                <th class="px-4 py-3 text-right">Utilidad Bruta</th>
                <th class="px-4 py-3 text-right">OPEX Directo</th>
                <th class="px-4 py-3 text-right">Indirectos Prorrateados</th>
                <th class="px-4 py-3 text-right">EBITDA</th>
                <th class="px-4 py-3 text-right">Utilidad Neta</th>
                <th class="px-4 py-3 text-right">Margen Neto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#e5e5ea]">
              <tr
                v-for="ch in activeSlice.channels"
                :key="ch.channel_id"
                :data-testid="`pyg-channel-row-${ch.code}`"
                :class="ch.is_loss ? 'bg-[#fff5f5]/70' : 'hover:bg-[#fbfbfd]'"
              >
                <td class="px-4 py-3 font-bold text-[#1d1d1f] flex items-center gap-2">
                  <span>{{ ch.name }}</span>
                  <span v-if="ch.is_loss" class="px-1.5 py-0.5 rounded bg-[#ff3b30] text-white text-[9px] font-black uppercase">Pérdida</span>
                </td>
                <td class="px-4 py-3 text-right font-semibold">{{ formatMoney(ch.net_revenue) }}</td>
                <td class="px-4 py-3 text-right text-[#5e6c84]">{{ ch.revenue_share_pct }}%</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(ch.cogs) }}</td>
                <td class="px-4 py-3 text-right font-semibold">{{ formatMoney(ch.gross_profit) }}</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(ch.direct_opex) }}</td>
                <td class="px-4 py-3 text-right text-[#5e6c84]">{{ formatMoney(ch.allocated_indirect_opex) }}</td>
                <td class="px-4 py-3 text-right font-bold" :class="ch.ebitda < 0 ? 'text-[#d70015]' : 'text-[#1d1d1f]'">
                  {{ formatMoney(ch.ebitda) }}
                </td>
                <td class="px-4 py-3 text-right font-bold" :class="ch.net_income < 0 ? 'text-[#d70015]' : 'text-[#248a3d]'">
                  {{ formatMoney(ch.net_income) }}
                </td>
                <td class="px-4 py-3 text-right font-black" :class="ch.net_margin_pct < 0 ? 'text-[#d70015]' : 'text-[#248a3d]'">
                  {{ ch.net_margin_pct }}%
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-[#f5f5f7] font-bold border-t-2 border-[#dfe1e6]">
              <tr>
                <td class="px-4 py-3">TOTAL CONSOLIDADO</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(activeSlice.consolidated.net_revenue) }}</td>
                <td class="px-4 py-3 text-right">100%</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(activeSlice.consolidated.cogs) }}</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(activeSlice.consolidated.gross_profit) }}</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(activeSlice.consolidated.direct_opex) }}</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(activeSlice.consolidated.allocated_indirect_opex) }}</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(activeSlice.consolidated.ebitda) }}</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(activeSlice.consolidated.net_income) }}</td>
                <td class="px-4 py-3 text-right">{{ activeSlice.consolidated.net_margin_pct }}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Panel Agente IA Financiero -->
      <div class="bg-gradient-to-br from-[#1d1d1f] to-[#2c2c2e] text-white rounded-3xl p-6 shadow-lg space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-[#b08d57]/20 border border-[#b08d57]/40 flex items-center justify-center text-[#e8d9b5]">
              <span class="material-symbols-outlined text-[24px]">auto_awesome</span>
            </div>
            <div>
              <h2 class="text-base font-bold text-white">Agente IA Financiero — Diagnóstico de Costos y Márgenes</h2>
              <p class="text-xs text-gray-300">Detecta sobrecostos, desviaciones por canal y dispara alertas tempranas de pérdida</p>
            </div>
          </div>

          <button
            type="button"
            data-testid="pyg-ai-analyze-btn"
            @click="runAiAnalysis"
            :disabled="aiLoading"
            class="px-5 py-2.5 rounded-xl bg-[#b08d57] hover:bg-[#8a6d3d] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[16px]">psychology</span>
            <span>{{ aiLoading ? 'Analizando PyG...' : 'Analizar Costos y Márgenes con IA' }}</span>
          </button>
        </div>

        <div v-if="aiAnalysis" data-testid="pyg-ai-panel" class="bg-white/10 border border-white/15 rounded-2xl p-5 space-y-4">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-[#e8d9b5]">Resumen Ejecutivo</span>
            <p class="text-sm text-white/95 mt-1 leading-relaxed">{{ aiAnalysis.executive_summary }}</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">Desviaciones y Sobrecostos</h4>
              <ul class="space-y-1.5 text-xs text-gray-200 list-disc pl-4">
                <li v-for="(d, idx) in aiAnalysis.cost_deviations" :key="'d-' + idx">{{ d }}</li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">Recomendaciones</h4>
              <ul class="space-y-1.5 text-xs text-gray-200 list-disc pl-4">
                <li v-for="(r, idx) in aiAnalysis.recommendations" :key="'r-' + idx">{{ r }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL REGISTRAR MOVIMIENTO -->
      <div v-if="showEntryModal" class="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="showEntryModal = false">
        <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#e5e5ea] overflow-hidden">
          <div class="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
            <h3 class="text-base font-bold text-[#1d1d1f]">Registrar Movimiento Financiero</h3>
            <button type="button" @click="showEntryModal = false" class="text-[#86868b] cursor-pointer"><span class="material-symbols-outlined">close</span></button>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex gap-2 bg-[#f5f5f7] p-1 rounded-xl">
              <button type="button" @click="entryMode = 'direct'" :class="['flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer', entryMode === 'direct' ? 'bg-white shadow-xs' : 'text-[#86868b]']">Movimiento Directo Canal</button>
              <button type="button" @click="entryMode = 'indirect'" :class="['flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer', entryMode === 'indirect' ? 'bg-white shadow-xs' : 'text-[#86868b]']">Gasto Indirecto Compartido</button>
            </div>

            <form v-if="entryMode === 'direct'" @submit.prevent="saveDirectEntry" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Canal</label>
                  <select v-model="directForm.channel_id" required class="w-full px-3 py-2 rounded-xl border text-xs bg-white">
                    <option v-for="c in channelsList" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Mes</label>
                  <input v-model="directForm.period_month" type="month" required class="w-full px-3 py-2 rounded-xl border text-xs" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Ventas Brutas</label>
                  <input v-model.number="directForm.gross_revenue" type="number" step="0.01" class="w-full px-3 py-2 rounded-xl border text-xs" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Devoluciones / Desc.</label>
                  <input v-model.number="directForm.returns_discounts" type="number" step="0.01" class="w-full px-3 py-2 rounded-xl border text-xs" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Costo de Ventas (COGS)</label>
                  <input v-model.number="directForm.cogs" type="number" step="0.01" class="w-full px-3 py-2 rounded-xl border text-xs" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Gastos Directos (OPEX)</label>
                  <input v-model.number="directForm.direct_opex" type="number" step="0.01" class="w-full px-3 py-2 rounded-xl border text-xs" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Depreciación / Amort.</label>
                  <input v-model.number="directForm.depreciation_amort" type="number" step="0.01" class="w-full px-3 py-2 rounded-xl border text-xs" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Impuestos / Financieros</label>
                  <input v-model.number="directForm.taxes_financial" type="number" step="0.01" class="w-full px-3 py-2 rounded-xl border text-xs" />
                </div>
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" @click="showEntryModal = false" class="px-4 py-2 rounded-xl bg-[#f5f5f7] text-xs font-bold cursor-pointer">Cancelar</button>
                <button type="submit" class="px-5 py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-bold cursor-pointer">Guardar Movimiento</button>
              </div>
            </form>

            <form v-else @submit.prevent="saveIndirectExpense" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Mes</label>
                  <input v-model="indirectForm.period_month" type="month" required class="w-full px-3 py-2 rounded-xl border text-xs" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Monto Total</label>
                  <input v-model.number="indirectForm.amount" type="number" step="0.01" required class="w-full px-3 py-2 rounded-xl border text-xs" />
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-[#5e6c84] mb-1">Categoría</label>
                <input v-model="indirectForm.category" required placeholder="Ej: Nómina Administrativa / Arriendo" class="w-full px-3 py-2 rounded-xl border text-xs" />
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" @click="showEntryModal = false" class="px-4 py-2 rounded-xl bg-[#f5f5f7] text-xs font-bold cursor-pointer">Cancelar</button>
                <button type="submit" class="px-5 py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-bold cursor-pointer">Guardar Gasto Indirecto</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- MODAL IMPORTAR CSV -->
      <div v-if="showCsvModal" class="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="showCsvModal = false">
        <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#e5e5ea] overflow-hidden">
          <div class="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
            <h3 class="text-base font-bold text-[#1d1d1f]">Importar Datos PyG desde CSV</h3>
            <button type="button" @click="showCsvModal = false" class="text-[#86868b] cursor-pointer"><span class="material-symbols-outlined">close</span></button>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-xs text-[#5e6c84]">
              Columnas esperadas: <code class="bg-[#f5f5f7] px-1 rounded">channel,period_month,gross_revenue,returns_discounts,cogs,direct_opex,depreciation_amort,taxes_financial,indirect_expense_category,indirect_expense_amount,notes</code>
            </p>
            <input type="file" accept=".csv,text/csv" @change="handleCsvFile" class="w-full text-xs" />
            <textarea v-model="csvText" rows="5" placeholder="Pega aquí el contenido CSV..." class="w-full p-3 rounded-xl border text-xs font-mono"></textarea>
            <div class="flex justify-end gap-2">
              <button type="button" @click="showCsvModal = false" class="px-4 py-2 rounded-xl bg-[#f5f5f7] text-xs font-bold cursor-pointer">Cancelar</button>
              <button type="button" @click="submitCsvImport" class="px-5 py-2 rounded-xl bg-[#1d1d1f] text-white text-xs font-bold cursor-pointer">Importar CSV</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../api/supabase';
import { getBogotaDateStr } from '../utils/bogotaTime';
import {
  DEFAULT_SALES_CHANNELS,
  calculatePygByChannel,
  buildLocalFinancialAnalysis,
} from '../utils/pygCalculator';

const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const selectedMonth = ref(getBogotaDateStr().slice(0, 7));
const viewScope = ref('monthly');
const aiLoading = ref(false);
const aiAnalysis = ref(null);

const channelsList = ref([]);
const report = ref(null);

const showEntryModal = ref(false);
const entryMode = ref('direct');
const directForm = ref({
  channel_id: '',
  period_month: selectedMonth.value,
  gross_revenue: 0,
  returns_discounts: 0,
  cogs: 0,
  direct_opex: 0,
  depreciation_amort: 0,
  taxes_financial: 0,
});
const indirectForm = ref({
  period_month: selectedMonth.value,
  category: '',
  amount: 0,
});

const showCsvModal = ref(false);
const csvText = ref('');

const emptySlice = {
  channels: [],
  loss_channels: [],
  total_indirect_expenses: 0,
  consolidated: {
    gross_revenue: 0, returns_discounts: 0, net_revenue: 0, cogs: 0,
    gross_profit: 0, gross_margin_pct: 0, direct_opex: 0, allocated_indirect_opex: 0,
    ebitda: 0, ebitda_margin_pct: 0, depreciation_amort: 0, taxes_financial: 0,
    net_income: 0, net_margin_pct: 0, is_loss: false,
  },
};

const activeSlice = computed(() => {
  if (!report.value) return emptySlice;
  return viewScope.value === 'ytd' ? (report.value.ytd || emptySlice) : (report.value.monthly || emptySlice);
});

const formatMoney = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(num);
};

const loadReport = async () => {
  aiAnalysis.value = null;
  const period = selectedMonth.value;
  const year = period.slice(0, 4);
  const ytdStart = `${year}-01`;

  if (apiUrl) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch(`${apiUrl}/api/v1/pyg/report?period_month=${period}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          report.value = await res.json();
          return;
        }
      }
    } catch (_) {}
  }

  // Fallback directo Supabase
  const [chRes, entRes, indRes] = await Promise.all([
    supabase.from('sales_channels').select('*').eq('active', true).order('name'),
    supabase.from('channel_financial_entries').select('*').gte('period_month', ytdStart).lte('period_month', period),
    supabase.from('indirect_expenses').select('*').gte('period_month', ytdStart).lte('period_month', period),
  ]);

  const channels = (chRes.data && chRes.data.length > 0) ? chRes.data : DEFAULT_SALES_CHANNELS;
  channelsList.value = channels;
  if (!directForm.value.channel_id && channels[0]) directForm.value.channel_id = channels[0].id;

  const allEntries = entRes.data || [];
  const allIndirect = indRes.data || [];
  const monthEntries = allEntries.filter((e) => e.period_month === period);
  const monthIndirect = allIndirect.filter((i) => i.period_month === period);

  report.value = {
    period_month: period,
    ytd_range: `${ytdStart} a ${period}`,
    monthly: calculatePygByChannel(channels, monthEntries, monthIndirect),
    ytd: calculatePygByChannel(channels, allEntries, allIndirect),
  };
};

const saveDirectEntry = async () => {
  await supabase.from('channel_financial_entries').insert({ ...directForm.value, source: 'manual' });
  showEntryModal.value = false;
  await loadReport();
};

const saveIndirectExpense = async () => {
  await supabase.from('indirect_expenses').insert({ ...indirectForm.value, source: 'manual' });
  showEntryModal.value = false;
  await loadReport();
};

const handleCsvFile = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    csvText.value = String(ev.target?.result || '');
  };
  reader.readAsText(file);
};

const submitCsvImport = async () => {
  if (!csvText.value.trim()) return;
  if (apiUrl) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch(`${apiUrl}/api/v1/pyg/import-csv`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ csv_text: csvText.value, trigger_alerts: true }),
        });
        if (res.ok) {
          showCsvModal.value = false;
          csvText.value = '';
          await loadReport();
          return;
        }
      }
    } catch (_) {}
  }
  showCsvModal.value = false;
  await loadReport();
};

const runAiAnalysis = async () => {
  if (!report.value) return;
  aiLoading.value = true;
  try {
    if (apiUrl) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch(`${apiUrl}/api/v1/pyg/ai-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ report: report.value, trigger_alerts: true }),
          });
          if (res.ok) {
            const json = await res.json();
            aiAnalysis.value = json.analysis;
            return;
          }
        }
      } catch (_) {}
    }
    aiAnalysis.value = buildLocalFinancialAnalysis(report.value);
  } finally {
    aiLoading.value = false;
  }
};

watch(selectedMonth, () => loadReport());
onMounted(loadReport);
</script>

