<!-- KOMPONENTA LINIJSKOG GRAFA ZA PRIKAT VRIJEDNOSTI ODABRANOG PARAMETRA K SLIKE KLIJENTA KROZ VRIJEME -->

<template>
  <!-- GLAVNI KONTEJNER GRAFIKONA KRVNE SLIKE -->
  <div class="measurement-chart">

    <!-- FIKSNA LIJEVA Y-OS -->
    <div class="measurement-chart-y-axis">
      <canvas ref="yAxisCanvas" width="48" height="270"></canvas>
    </div>

    <!-- HORIZONTALNO SCROLLABILNI DIO -->
    <div ref="chartScrollContainer" class="measurement-chart-scroll">

      <div
        class="measurement-chart-scroll-content"
        :style="{ width: `${chartPixelWidth}px` }"
      >
        <canvas
          ref="chartCanvas"
          :width="chartPixelWidth"
          :height="chartHeight"
        ></canvas>
      </div>

    </div>

    <!-- FIKSNI ZAVRŠNI RAZMAK -->
    <div class="measurement-chart-right-space" aria-hidden="true"></div>

  </div>
</template>

<script setup>

// Vue funkcije za životni ciklus, ažuriranje i praćenje promjena
import { nextTick, onBeforeUnmount, onMounted, ref,  watch } from 'vue'
// Chart.js za crtanje grafikona
import Chart from 'chart.js/auto'

// PODACI KOJE KOMPONENTA PRIMA OD RODITELJSKOG EKRANA
const props = defineProps({
  // Rezultati odabranog parametra krvne slike
  data: {
    type: Array,
    default: () => []
  },

  // Odabrano vremensko razdoblje
  period: {
    type: String,
    default: '1m'
  },

  // Jedinica odabranog parametra
  unit: {
    type: String,
    default: ''
  }

}) //const props zagrada

// REFERENCE NA ELEMENTE GRAFIKONA
const chartCanvas = ref(null)
const yAxisCanvas = ref(null)
const chartScrollContainer = ref(null)

// AKTIVNE INSTANCE GRAFIKONA
let chartInstance = null
let yAxisChartInstance = null

// DIMENZIJE GRAFIKONA
const minimumChartWidth = 320
const chartHeight = 270
const chartTopSpace = 20
const chartBottomSpace = 38
const edgeSpace = 18
const monthPointGap = 17
const monthGroupSpacing = 76

// ŠIRINA GRAFIKONA
const chartPixelWidth = ref(minimumChartWidth)

// NAZIVI MJESECI
const monthLabels = [
  'SIJ', 'VELJ', 'OŽU', 'TRA', 'SVI', 'LIP',
  'SRP', 'KOL', 'RUJ', 'LIS', 'STU', 'PRO'
]

// FUNKCIJA ZA FORMATIRANJE BROJČANIH VRIJEDNOSTI
function formatValue(value) {
  return Number(value).toLocaleString('hr-HR', {
    maximumFractionDigits: 2
  })
}

// FUNKCIJA ZA ODREĐIVANJE RAZUMLJIVOG KORAKA Y-OSI
function getNiceStep(rawStep) {

  if (!Number.isFinite(rawStep) || rawStep <= 0) { return 1  }

  const magnitude = Math.pow(
    10,
    Math.floor(Math.log10(rawStep))
  )

  const normalized = rawStep / magnitude

  let multiplier

  if (normalized <= 1) {
    multiplier = 1
  } else if (normalized <= 2) {
    multiplier = 2
  } else if (normalized <= 5) {
    multiplier = 5
  } else {
    multiplier = 10
  }

  return multiplier * magnitude

} //function getNiceStep zagrada

// FUNKCIJA ZA IZRAČUN RASPONA I OZNAKA Y-OSI PREMA STVARNIM NALAZIMA
function getAxisConfig(values) {

  const numericValues = values
    .map(value => Number(value))
    .filter(value => Number.isFinite(value))

  // ZADANI RASPON AKO NEMA VALJANIH PODATAKA
  if (numericValues.length === 0) {
    return {
      min: 0,
      max: 5,
      step: 1,
      ticks: [0, 1, 2, 3, 4, 5],
      gridTicks: [0, 1, 2, 3, 4, 5]
    } //return zagrada
  } //if zagrada

  // NAJMANJA I NAJVEĆA STVARNA VRIJEDNOST
  const minimum = Math.min(...numericValues)
  const maximum = Math.max(...numericValues)
  const range = maximum - minimum

  // KORAK PREMA VELIČINI PARAMETRA
  const valueMagnitude = Math.max(
    Math.abs(minimum),
    Math.abs(maximum),
    1
  )

  let step = valueMagnitude >= 20
    ? Math.pow(10, Math.floor(Math.log10(valueMagnitude / 2)))
    : 1

  step = Math.max(1, step)

  // POVEĆANJE KORAKA KOD VELIKIH RASPONA
  while (range / step > 6) {
    step = getNiceStep(step * 1.01)
  }

  // DODATNI PROSTOR IZNAD I ISPOD VRIJEDNOSTI
  const axisMin = Math.floor(minimum / step) * step - step
  const axisMax = Math.ceil(maximum / step) * step + step

  const tickCount = Math.round((axisMax - axisMin) / step)

  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, index) => Math.round(axisMin + index * step)
  ) //const ticks zagrada

  // DODATNE LINIJE MREŽE NA POLOVICI GLAVNOG KORAKA
  const gridStep = step / 2
  const gridTickCount = Math.round((axisMax - axisMin) / gridStep)

  const gridTicks = Array.from(
    { length: gridTickCount + 1 },
    (_, index) =>
      Number((axisMin + index * gridStep).toPrecision(12))
  ) //const gridTicks zagrada

  return {
    min: axisMin,
    max: axisMax,
    step,
    ticks,
    gridTicks
  } //return zagrada

} //function getAxisConfig zagrada

// FUNKCIJA ZA PRETVARANJE PODATAKA U FORMAT GRAFIKONA
function getChartData() {

  const measurements = props.data
    .map(item => ({
      date: String(item.date ?? ''),
      y: Number(item.value)
    }))
    .filter(item =>
      item.date &&
      Number.isFinite(item.y) &&
      !Number.isNaN(
        new Date(`${item.date}T00:00:00`).getTime()
      )
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  if (measurements.length === 0) {   return []  }

  // VEĆI RAZMAK ZA JEDNOMJESEČNI PRIKAZ
  if (props.period === '1m') {

    const pointSpacing = 48

    return measurements.map((measurement, index) => ({
      ...measurement,
      plotX: edgeSpace + index * pointSpacing
    }))

  } //if zagrada

  // GRUPIRANJE NALAZA PREMA MJESECU I GODINI
  const groups = new Map()

  measurements.forEach(measurement => {

    const date = new Date(`${measurement.date}T00:00:00`)
    const key = `${date.getFullYear()}-${date.getMonth()}`

    if (!groups.has(key)) {
      groups.set(key, [])
    } //if zagrada

    groups.get(key).push(measurement)

  }) //measurements.forEACH zagrada

  // IZRAČUN VODORAVNIH POLOŽAJA
  let cursor = edgeSpace
  const result = []

  groups.forEach(group => {

    group.forEach((measurement, index) => {

      result.push({
        ...measurement,
        plotX: cursor + index * monthPointGap
      })

    }) //group.forEach

    const groupWidth = Math.max(0, group.length - 1) * monthPointGap

    cursor += Math.max(
      monthGroupSpacing,
      groupWidth + monthPointGap + 24
    )

  }) //groups.forEach zagrada

  return result

} //function getChartData zagrada

// FUNKCIJA ZA FORMATIRANJE DATUMA ZA TOOLTIP
function formatTooltipDate(dateValue) {

  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return ''
  } //if zagrada

  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)

} //function formatTooltipDate zagrada

// FUNKCIJA ZA FORMATIRANJE DATUMA ZA VODORAVNU OS
function formatAxisDate(dateValue) {

  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return ''
  } // if zagrada

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${day}.${month}`

} //function formatAxisDate zagrada

// FUNKCIJA - KLJUČ MJESECA I GODINE
function getMonthGroupKey(dateValue) {

  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return null
  } //if zagrada

  return `${date.getFullYear()}-${date.getMonth()}`

} //function getMonthGroupKey zagrada

// FUNKCIJA ZA - TEKSTUALNA OZNAKA MJESECA I GODINE
function formatMonthGroupLabel(dateValue, showYear = true) {

  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return ''
  } //if zagrada

  const month = monthLabels[date.getMonth()]
  const year = date.getFullYear()

  return showYear ? `${month}\n${year}` : month

} //function formatMonthGroupLabel zagrada

// FUNKCIJA ZA OZNAKE MJESECA NA VODORAVNOJ OSI
function getGroupedAxisLabels(data) {

  const years = new Set(
    data.map(item => {

      const date = new Date(`${item.date}T00:00:00`)

      return Number.isNaN(date.getTime())
        ? null
        : date.getFullYear()

    }).filter(year => year !== null)
  ) //const years zagrada

  const showYear = years.size > 1
  const labels = []
  const displayedGroups = new Set()

  data.forEach(item => {

    const groupKey = getMonthGroupKey(item.date)

    if (!groupKey || displayedGroups.has(groupKey)) { return }

    displayedGroups.add(groupKey)

    labels.push({
      label: formatMonthGroupLabel(item.date, showYear),
      plotX: item.plotX
    })

  }) //data.forEach zagrada

  return labels

} //function getGroupedAxisLabels zagrada

// IZRAČUN ŠIRINE GRAFIKONA
function calculateChartWidth(data) {

  const visibleWidth = Math.max(
    minimumChartWidth,
    chartScrollContainer.value?.clientWidth || minimumChartWidth
  )

  const lastPoint = data.length > 0
    ? Math.max(...data.map(item => item.plotX))
    : edgeSpace

  const trailingSpace = props.period === '1m' ? 48 : 40

  chartPixelWidth.value = Math.max(
    visibleWidth,
    lastPoint + trailingSpace
  )

  return chartPixelWidth.value

} //function calculateChartWidth zagrada

// FUNKCIJA ZA UNIŠTAVANJE GRAFIKONA
function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

// FUNKCIJA ZA UNIŠTAVANJE FIKSNE Y-OSI
function destroyYAxisChart() {
  if (yAxisChartInstance) {
    yAxisChartInstance.destroy()
    yAxisChartInstance = null
  }
}

// FUNKCIJA ZA UNIŠTAVANJE SVIH INSTANCI
function destroyCharts() {
  destroyChart()
  destroyYAxisChart()
}

// FUNKCIJA ZA VRAĆANJE SCROLLA NA POČETAK
function scrollChartToStart() {
  if (!chartScrollContainer.value) { return }

  chartScrollContainer.value.scrollLeft = 0
}

// PLUGIN ZA OZNAKE DATUMA
const xAxisLabelsPlugin = {

  id: 'bloodTestXAxisLabels',

  afterDraw(chart) {

    const xScale = chart.scales.x

    if (!xScale) { return }

    const ctx = chart.ctx
    const data = chart.data.datasets?.[0]?.data || []

    const labels = props.period === '1m'
      ? data.map(item => ({
          label: formatAxisDate(item.date),
          plotX: item.x
        }))
      : getGroupedAxisLabels(
          data.map(item => ({
            date: item.date,
            plotX: item.x
          }))
        )

    ctx.save()
    ctx.fillStyle = '#BDC4D4'
    ctx.font = '700 12px sans-serif'
    ctx.textBaseline = 'top'

    labels.forEach(item => {

      if (!item.label) { return }

      const x = xScale.getPixelForValue(item.plotX)
      const y = xScale.bottom + 4

      ctx.textAlign = 'left'

      item.label.split('\n').forEach((line, lineIndex) => {
        ctx.fillText(line, x, y + lineIndex * 14)
      })

    }) //labels.forEach zagrada

    ctx.restore()

  } //afterDraw zagrada

} //const xAxisLabelsPlugin zagrada

// PLUGIN ZA OZNAKE Y-OSI
const yAxisLabelsPlugin = {

  id: 'bloodTestYAxisLabels',

  afterDraw(chart) {
    const yScale = chart.scales.y

    if (!yScale) { return }

    const ctx = chart.ctx
    const axisConfig = chart.options.plugins.bloodTestAxisConfig

    if (!axisConfig?.ticks) { return }

    ctx.save()
    ctx.fillStyle = '#BDC4D4'
    ctx.font = '700 11px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    axisConfig.ticks.forEach(value => {

      const y = yScale.getPixelForValue(value)

      if (y < yScale.top - 1 || y > yScale.bottom + 1) {
        return
      } //if zagrada

      ctx.fillText(formatValue(value), 0, y)

    }) //axisConfig zagrada

    ctx.restore()

  } //afterDraw zagrada

} //const yAxisLabelsPlugin zagrada

// STVARANJE FIKSNE Y-OSI
function createYAxisChart(axisConfig) {

  yAxisCanvas.value.width = 48
  yAxisCanvas.value.height = chartHeight

  yAxisChartInstance = new Chart(yAxisCanvas.value, {

    type: 'line',

    plugins: [yAxisLabelsPlugin],

    data: { datasets: [] },

    options: {
      responsive: false,
      maintainAspectRatio: false,
      events: [],
      animation: false,

      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        bloodTestAxisConfig: axisConfig
      },

      layout: {
        padding: {
          top: chartTopSpace,
          right: 0,
          bottom: chartBottomSpace,
          left: 0
        }
      }, //layout zagrada

      scales: {

        x: {
          display: false,
          min: 0,
          max: 1
        },

        y: {
          min: axisConfig.min,
          max: axisConfig.max,
          ticks: { display: false },
          grid: { display: false },
          border: { display: false }
        } //Y zagrada
      } //scales zagrada

    } //options zagrada
  }) //yAxisChartInstance zagrada

} //function createYAxisChart zagrada

// FUNKCIJA ZA STVARANJE GLAVNOG GRAFIKONA
async function createChart() {

  await nextTick()

  if (!chartCanvas.value || !yAxisCanvas.value) { return }

  const chartData = getChartData()

  // PRAZAN GRAFIKON
  if (chartData.length === 0) {
    destroyCharts()
    chartPixelWidth.value = minimumChartWidth
    return
  } //if zagrada

  // IZRAČUN DIMENZIJA I SKALE
  calculateChartWidth(chartData)

  const axisConfig = getAxisConfig(
    chartData.map(item => item.y)
  )

  await nextTick()

  createYAxisChart(axisConfig)

  chartCanvas.value.width = chartPixelWidth.value
  chartCanvas.value.height = chartHeight

  // GLAVNI CHART.JS GRAFIKON
  chartInstance = new Chart(chartCanvas.value, {

    type: 'line',
    plugins: [xAxisLabelsPlugin],
    data: {
      labels: [],
      datasets: [
        {
          label: props.unit
            ? `Rezultat (${props.unit})`
            : 'Rezultat',

          data: chartData.map(item => ({
            x: item.plotX,
            y: item.y,
            date: item.date
          })),

          // STIL ISTI KAO POSTOJEĆI GRAFIKON
          borderColor: '#52677D',
          backgroundColor: 'rgba(82, 103, 125, 0.12)',
          borderWidth: 2,
          tension: 0.18,
          fill: true,

          pointRadius: 4,
          pointBackgroundColor: '#6A85A1',
          pointBorderColor: '#6A85A1',
          pointBorderWidth: 1.5,
          pointHitRadius: 18

        }
      ] //datasets zagrada

    }, //data zagrada

    options: {
      responsive: false,
      maintainAspectRatio: false,
      events: ['click'],

      interaction: {
        mode: 'nearest',
        intersect: true
      },

      animation: {
        duration: 0,
        easing: 'easeOutQuart'
      },

      plugins: {
        legend: { display: false },

        tooltip: {
          enabled: true,

          backgroundColor: '#1C2E4A',
          titleColor: '#BDC4D4',
          bodyColor: '#BDC4D4',
          padding: 10,
          cornerRadius: 8,

          callbacks: {

            title: items => {
              const dateValue = items[0]?.raw?.date
              return dateValue ? formatTooltipDate(dateValue) : ''
            },

            label: context => {

              const value = formatValue(context.parsed.y)

              return props.unit
                ? `Vrijednost: ${value} ${props.unit}`
                : `Vrijednost: ${value}`

            } //label: zagrada
          } //callbacks zagrada

        } //tooltip zagrada
      }, //plugins zagrada

      layout: {
        padding: {
          top: chartTopSpace,
          right: 10,
          bottom: chartBottomSpace,
          left: 0
        } //padding zagrada
      }, //layout zagrada

      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: Math.max(
            1,
            chartPixelWidth.value -
              (props.period === '1m' ? 48 : edgeSpace)
          ),

          grid: { display: false },

          ticks: { display: false },

          border: {
            display: true,
            color: '#52677D',
            width: 1
          }

        }, //x zagrada

        y: {

          min: axisConfig.min,
          max: axisConfig.max,

          // MREŽA PREMA IZRAČUNATIM VRIJEDNOSTIMA
          afterBuildTicks(scale) {
            scale.ticks = axisConfig.gridTicks.map(value => ({
              value
            }))
          },

          grid: {
            display: true,
            drawOnChartArea: true,
            color: 'rgba(189, 196, 212, 0.18)',
            drawTicks: false,
            lineWidth: 1
          },

          ticks: { display: false },

          border: { display: false }

        } //y zagrada

      } //scales zagrada

    }, //options zagrada

    // KLIK NA TOČKU PRIKAZUJE TOOLTIP
    onClick: (event, elements, chart) => {

      const activeElements = chart.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        true
      ) //const activeElements

      if (!activeElements.length) { return }

      const element = activeElements[0]

      chart.setActiveElements([
        {
          datasetIndex: element.datasetIndex,
          index: element.index
        }
      ]) //chart.setActiveElements

      chart.tooltip.setActiveElements(
        [
          {
            datasetIndex: element.datasetIndex,
            index: element.index
          }
        ],
        {
          x: element.element.x,
          y: element.element.y
        }
      ) //chart.tooltip zagrada

      chart.update('none')

    } //onClick zagrada

  }) //chartInstance zagrada

  await nextTick()

  scrollChartToStart()

} //async function createChart zagrada

// FUNKCIJA ZA PONOVNO STVARANJE GRAFIKONA
async function refreshChart() {
  destroyCharts()
  await nextTick()
  await createChart()
}

// POČETNO STVARANJE
onMounted(async () => {
  await nextTick()
  await createChart()
})

// AŽURIRANJE NAKON PROMJENE PODATAKA, FILTERA ILI JEDINICE
watch(
  [
    () => props.data,
    () => props.period,
    () => props.unit
  ],
  () => {
    refreshChart()
  },
  { deep: true }
) //watch zagrada

// OSLOBAĐANJE RESURSA
onBeforeUnmount(() => {
  destroyCharts()
})

</script>

<style scoped>

/* GLAVNI GRAFIKON */
.measurement-chart {
  display: flex;
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 270px;
  overflow: hidden;
  box-sizing: border-box;
}

/* FIKSNI PROSTOR Y-OSI */
.measurement-chart-y-axis {
  flex: 0 0 48px; /* micanje grafa prema y osi */
  width: 48px;
  height: 270px;
  overflow: hidden;
  background: transparent;
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* CANVAS Y-OSI */
.measurement-chart-y-axis canvas {
  display: block;
  width: 48px !important;
  height: 270px !important;
  max-width: 48px;
}

/* VERTIKALNA LINIJA Y-OSI */
.measurement-chart-y-axis::after {
  content: '';
  position: absolute;
  top: 20px;
  right: 0;
  bottom: 28px;
  width: 1px;
  background: #52677D;
}

/* HORIZONTALNO POMICANJE scrollabilni središnji dio */
.measurement-chart-scroll {
  flex: 1 1 auto;
  min-width: 0;
  width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  position: relative;
  box-sizing: border-box;
}

/* SAKRIVANJE SCROLLBARA */
.measurement-chart-scroll::-webkit-scrollbar {
  display: none;
}

/* SADRŽAJ GRAFIKONA */
.measurement-chart-scroll-content {
  height: 270px;
  flex: 0 0 auto;
  position: relative;
  box-sizing: border-box;
}

/* GLAVNI CANVAS */
.measurement-chart-scroll-content canvas {
  display: block;
  width: auto !important;
  max-width: none;
  height: 270px !important;
}

/* ZAVRŠNI RAZMAK */
.measurement-chart-right-space {
  flex: 0 0 18px;
  width: 18px;
  height: 270px;
  flex-shrink: 0;
  pointer-events: none;
}

</style>
