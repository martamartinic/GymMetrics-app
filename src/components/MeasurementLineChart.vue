
<template>
    <!-- Glavni kontejner grafikona -->
    <div class="measurement-chart">
        <!-- Fiksna lijeva Y-os -->
        <div class="measurement-chart-y-axis">
            <canvas ref="yAxisCanvas" width="48" height="270"> </canvas>
        </div>

        <!-- Horizontalno scrollabilni središnji dio -->
        <div ref="chartScrollContainer" class="measurement-chart-scroll">
            <!-- Sadržaj zadržava izračunatu širinu grafikona -->
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

        <!-- Fiksni završni razmak -->
        <div class="measurement-chart-right-space" aria-hidden="true"></div>
    </div>
</template>

<script setup>
// Vue funkcije za životni ciklus, ažuriranje prikaza i praćenje promjena
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Chart.js služi za crtanje grafikona
import Chart from 'chart.js/auto'

// Podaci koje komponenta prima od roditeljskog ekrana
const props = defineProps({
    // Popis mjerenja s datumom i stvarnom vrijednošću
    data: {
        type: Array,
        default: () => []
    },
    // Odabrano vremensko razdoblje
    period: {
        type: String,
        default: '1m'
    },
    // Jedinica odabrane vrste mjerenja
    unit: {
        type: String,
        default: ''
    }
}) // defineProps

// Reference na elemente grafikona
const chartCanvas = ref(null)
const yAxisCanvas = ref(null)
const chartScrollContainer = ref(null)

// Aktivne instance grafikona
let chartInstance = null
let yAxisChartInstance = null

// Dimenzije grafikona
const minimumChartWidth = 320
const chartHeight = 270
const chartTopSpace = 20
const chartBottomSpace = 38
const edgeSpace = 18
const monthPointGap = 17
const monthGroupSpacing = 76

// Širina grafikona prema broju i položaju mjerenja
const chartPixelWidth = ref(minimumChartWidth)

// Nazivi mjeseci za oznake vodoravne osi
const monthLabels = [
    'SIJ', 'VELJ', 'OŽU', 'TRA', 'SVI', 'LIP',
    'SRP', 'KOL', 'RUJ', 'LIS', 'STU', 'PRO'
]

// Formatiranje vrijednosti prema hrvatskim postavkama
function formatValue(value) {
    return Number(value).toLocaleString('hr-HR', {
        maximumFractionDigits: 2
    })
} // formatValue

// Određivanje razumljivog koraka Y-osi
function getNiceStep(rawStep) {
    // Zaštita od nevaljanog ili nultog koraka
    if (!Number.isFinite(rawStep) || rawStep <= 0) {
        return 1
    } // if

    // Određivanje reda veličine koraka
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
    const normalized = rawStep / magnitude

    // Odabir koraka koji se lako čita na osi
    let multiplier

    if (normalized <= 1) {
        multiplier = 1
    } else if (normalized <= 2) {
        multiplier = 2
    } else if (normalized <= 5) {
        multiplier = 5
    } else {
        multiplier = 10
    } // if

    return multiplier * magnitude
} // getNiceStep

// Izračun raspona i oznaka Y-osi prema stvarnim mjerenjima
function getAxisConfig(values) {
    // Zadržavanje samo konačnih brojčanih vrijednosti
    const numericValues = values
        .map(value => Number(value))
        .filter(value => Number.isFinite(value))

    // Zadani raspon kada nema valjanih podataka
    if (numericValues.length === 0) {
        return {
            min: 0,
            max: 5,
            step: 1,
            ticks: [0, 1, 2, 3, 4, 5],
            gridTicks: [0, 1, 2, 3, 4, 5]
        }
    } // if

    // Najmanja i najveća stvarna vrijednost
    const minimum = Math.min(...numericValues)
    const maximum = Math.max(...numericValues)
    const range = maximum - minimum

    //korak za uski raspon prema veličini mjerenja
    const valueMagnitude = Math.max(Math.abs(minimum), Math.abs(maximum), 1)

    let step = valueMagnitude >=20 ? Math.pow(10, Math.floor(Math.log10(valueMagnitude / 2))) : 1
    step = Math.max(1,step)

    // Povećanje koraka kod velikih raspona
    while (range / step > 6) { step = getNiceStep(step * 1.01) }

    // Dodavanje prostora iznad i ispod krajnjih mjerenja
    const axisMin = Math.floor(minimum / step) * step - step
    const axisMax = Math.ceil(maximum / step) * step + step

    //izrada oznaka u pravilnim cjelobrojnim razmacima
    const tickCount = Math.round((axisMax - axisMin) / step)
    const ticks = Array.from(
        {length: tickCount + 1 },
        (_, index) => Math.round(axisMin + index * step)
    )
    // Dodatne crte mreže na polovici između glavnih oznaka
    const gridStep = step / 2
    const gridTickCount = Math.round((axisMax - axisMin) / gridStep)
    const gridTicks = Array.from(
        { length: gridTickCount + 1 },
        (_, index) => Number((axisMin + index * gridStep).toPrecision(12)
        )
    )
    return {
        min: axisMin,
        max: axisMax,
        step,
        ticks,
        gridTicks
    }
} // getAxisConfig

// Pretvaranje podataka iz baze u format grafikona
function getChartData() {
    // Pretvaranje datuma i vrijednosti u standardizirani oblik
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

    // Nema točaka ako nema valjanih mjerenja
    if (measurements.length === 0) {
        return []
    } // if

    // Za jednomjesečni prikaz ostavljamo veći razmak između zapisa
    if (props.period === '1m') {
        const pointSpacing = 48

        return measurements.map((measurement, index) => ({
            ...measurement,
            plotX: edgeSpace + index * pointSpacing
        }))
    } // if

    // Grupiranje mjerenja prema mjesecu i godini
    const groups = new Map()

    measurements.forEach(measurement => {
        const date = new Date(`${measurement.date}T00:00:00`)
        const key = `${date.getFullYear()}-${date.getMonth()}`

        if (!groups.has(key)) {
            groups.set(key, [])
        } // if

        groups.get(key).push(measurement)
    }) // forEach

    // Izračun vodoravnih položaja uz razmak između mjeseci
    let cursor = edgeSpace
    const result = []

    groups.forEach(group => {
        group.forEach((measurement, index) => {
            result.push({
                ...measurement,
                plotX: cursor + index * monthPointGap
            })
        }) // forEach

        // Sljedeća skupina dobiva vlastiti prostor
        const groupWidth = Math.max(0, group.length - 1) * monthPointGap
        cursor += Math.max(monthGroupSpacing, groupWidth + monthPointGap + 24)
    }) // forEach

    return result
} // getChartData

// Formatiranje punog datuma za tooltip
function formatTooltipDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    // Neispravan datum ne prikazuje se
    if (Number.isNaN(date.getTime())) {
        return ''
    } // if

    return new Intl.DateTimeFormat('hr-HR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date)
} // formatTooltipDate

// Formatiranje kratkog datuma za vodoravnu os
function formatAxisDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    if (Number.isNaN(date.getTime())) {
        return ''
    } // if

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')

    return `${day}.${month}`
} // formatAxisDate

// Jedinstveni ključ mjeseca i godine
function getMonthGroupKey(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    if (Number.isNaN(date.getTime())) {
        return null
    } // if

    return `${date.getFullYear()}-${date.getMonth()}`
} // getMonthGroupKey

// Tekstualna oznaka mjeseca i godine
function formatMonthGroupLabel(dateValue, showYear = true) {
    const date = new Date(`${dateValue}T00:00:00`)

    if (Number.isNaN(date.getTime())) {
        return ''
    } // if

    const month = monthLabels[date.getMonth()]
    const year = date.getFullYear()

    return showYear ? `${month}\n${year}` : month
} // formatMonthGroupLabel

// Izrada jedne oznake za svaki mjesec
function getGroupedAxisLabels(data) {
    // Godine koje postoje u prikazanim mjerenjima
    const years = new Set(
        data.map(item => {
            const date = new Date(`${item.date}T00:00:00`)

            return Number.isNaN(date.getTime())
                ? null
                : date.getFullYear()
        }).filter(year => year !== null)
    )

    // Godina se prikazuje samo ako podaci obuhvaćaju više godina
    const showYear = years.size > 1
    const labels = []
    const displayedGroups = new Set()

    data.forEach(item => {
        const groupKey = getMonthGroupKey(item.date)

        if (!groupKey || displayedGroups.has(groupKey)) {
            return
        } // if

        displayedGroups.add(groupKey)

        labels.push({
            label: formatMonthGroupLabel(item.date, showYear),
            plotX: item.plotX
        })
    }) // forEach

    return labels
} // getGroupedAxisLabels

// Izračun potrebne širine grafikona
function calculateChartWidth(data) {
    // Vidljiva širina prostora za pomicanje
    const visibleWidth = Math.max(
        minimumChartWidth,
        chartScrollContainer.value?.clientWidth || minimumChartWidth
    )

    // Vodoravni položaj posljednje točke
    const lastPoint = data.length > 0
        ? Math.max(...data.map(item => item.plotX))
        : edgeSpace

    // Dodatni prostor nakon posljednjeg mjerenja
    const trailingSpace = props.period === '1m' ? 48 : 40

    chartPixelWidth.value = Math.max(
        visibleWidth,
        lastPoint + trailingSpace
    )

    return chartPixelWidth.value
} // calculateChartWidth

// Uništavanje glavnog grafikona
function destroyChart() {
    if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
    } // if
} // destroyChart

// Uništavanje grafikona fiksne Y-osi
function destroyYAxisChart() {
    if (yAxisChartInstance) {
        yAxisChartInstance.destroy()
        yAxisChartInstance = null
    } // if
} // destroyYAxisChart

// Uništavanje svih aktivnih grafikona
function destroyCharts() {
    destroyChart()
    destroyYAxisChart()
} // destroyCharts

// Povratak na početak vodoravnog prikaza
function scrollChartToStart() {
    if (!chartScrollContainer.value) {
        return
    } // if

    chartScrollContainer.value.scrollLeft = 0
} // scrollChartToStart

// Plugin za ručno iscrtavanje oznaka datuma
const xAxisLabelsPlugin = {
    id: 'measurementXAxisLabels',

    afterDraw(chart) {
        const xScale = chart.scales.x

        if (!xScale) {
            return
        } // if

        const ctx = chart.ctx
        const data = chart.data.datasets?.[0]?.data || []

        // Kratki datumi za mjesec, grupiranje za dulja razdoblja
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
            if (!item.label) {
                return
            } // if

            const x = xScale.getPixelForValue(item.plotX)
            const y = xScale.bottom + 4

            ctx.textAlign = 'left'

            item.label.split('\n').forEach((line, lineIndex) => {
                ctx.fillText(line, x, y + lineIndex * 14)
            })
        }) // forEach

        ctx.restore()
    } // afterDraw
} // xAxisLabelsPlugin

// Plugin za ručno iscrtavanje vrijednosti fiksne Y-osi
const yAxisLabelsPlugin = {
    id: 'measurementYAxisLabels',

    afterDraw(chart) {
        const yScale = chart.scales.y

        if (!yScale) {
            return
        } // if

        const ctx = chart.ctx
        const axisConfig = chart.options.plugins.measurementAxisConfig

        if (!axisConfig?.ticks) {
            return
        } // if

        ctx.save()
        ctx.fillStyle = '#BDC4D4'
        ctx.font = '700 11px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'

        axisConfig.ticks.forEach(value => {
            const y = yScale.getPixelForValue(value)

            // Oznake izvan vidljivog dijela ne crtaju se
            if (y < yScale.top - 1 || y > yScale.bottom + 1) {
                return
            } // if

            ctx.fillText(formatValue(value), 0, y)
        }) // forEach

        ctx.restore()
    } // afterDraw
} // yAxisLabelsPlugin

// Stvaranje fiksne Y-osi
function createYAxisChart(axisConfig) {
   // if (!yAxisCanvas.value) {  return } // if

   // destroyYAxisChart()

   // Stvarne dimenzije canvasa fiksne Y-osi
    yAxisCanvas.value.width = 48
    yAxisCanvas.value.height = chartHeight

    //Stvaranje grafikona fiksne y osi
    yAxisChartInstance = new Chart(yAxisCanvas.value, {
        type: 'line',
        plugins: [yAxisLabelsPlugin],
        data: {datasets: []  },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            events: [],
            animation: false,

            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                },
                measurementAxisConfig: axisConfig
            },

            layout: {
                padding: {
                    top: chartTopSpace,
                    right: 0,
                    bottom: chartBottomSpace,
                    left: 0
                }
            },

            scales: {
                x: {
                    display: false,
                    min: 0,
                    max: 1
                },
                y: {
                    min: axisConfig.min,
                    max: axisConfig.max,
                    ticks: {
                        display: false
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    })
} // createYAxisChart

// Stvaranje glavnog grafikona mjerenja
async function createChart() {
    // Čekanje prikaza canvas elemenata
    await nextTick()

    if (!chartCanvas.value || !yAxisCanvas.value) {
        return
    } // if

    // Priprema kronološki poredanih mjerenja
    const chartData = getChartData()

    // Prazan grafikon ne zadržava stare podatke
    if (chartData.length === 0) {
        destroyCharts()
        chartPixelWidth.value = minimumChartWidth
        return
    } // if

    // Izračun širine i vertikalne skale
    calculateChartWidth(chartData)

    const axisConfig = getAxisConfig(
        chartData.map(item => item.y)
    )

    // Čekanje primjene dimenzija
    await nextTick()

    // Stvaranje fiksne Y-osi
    createYAxisChart(axisConfig)

    // Postavljanje stvarnih dimenzija canvasa
    chartCanvas.value.width = chartPixelWidth.value
    chartCanvas.value.height = chartHeight

    // Stvaranje glavnog grafikona
    chartInstance = new Chart(chartCanvas.value, {
        type: 'line',
        plugins: [xAxisLabelsPlugin],

        data: {
            labels: [],
            datasets: [
                {
                    // Vrijednosti ostaju stvarni zapisi iz baze
                    label: props.unit
                        ? `Mjerenje (${props.unit})`
                        : 'Mjerenje',

                    data: chartData.map(item => ({
                        x: item.plotX,
                        y: item.y,
                        date: item.date
                    })),

                    // Boje i stil usklađeni s grafikonom ocjena
                    borderColor: '#52677D',
                    backgroundColor: 'rgba(82, 103, 125, 0.12)',
                    borderWidth: 2,
                    tension: 0.18,
                    fill: true,

                    pointRadius: 4,
                    pointBackgroundColor: '#6A85A1',
                    pointBorderColor: '#6A85A1',
                    pointBorderWidth: 1.5,
                    pointHitRadius: 18,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#52677D',
                    pointHoverBorderColor: '#52677D',
                    pointHoverBorderWidth: 2
                }
            ]
        },

        options: {
            responsive: false,
            maintainAspectRatio: false,
            events: ['click'],

            interaction: {
                mode: 'nearest',
                intersect: true
            },

            animation: {
                duration: 0, //400,
                easing: 'easeOutQuart'
            },

            plugins: {
                legend: {
                    display: false
                },

                // Tooltip prikazuje puni datum i stvarnu vrijednost
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

                            return dateValue
                                ? formatTooltipDate(dateValue)
                                : ''
                        },

                        label: context => {
                            const value = formatValue(context.parsed.y)

                            return props.unit
                                ? `Vrijednost: ${value} ${props.unit}`
                                : `Vrijednost: ${value}`
                        }
                    }
                }
            },

            // Gornji i donji razmak odgovaraju grafikonu ocjena
            layout: {
                padding: {
                    top: chartTopSpace,
                    right: 10,
                    bottom: chartBottomSpace,
                    left: 0
                }
            },

            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: Math.max(
                        1,
                        chartPixelWidth.value -
                            (props.period === '1m' ? 48 : edgeSpace)
                    ),
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false
                    },
                    border: {
                        display: true,
                        color: '#52677D',
                        width: 1
                    }
                },

                y: {
                    min: axisConfig.min,
                    max: axisConfig.max,

                    // Mreža prati iste vrijednosti kao fiksna Y-os
                    afterBuildTicks(scale) {
                        scale.ticks = axisConfig.gridTicks.map(value => ({ value }))
                    },

                    grid: {
                        display: true,
                        drawOnChartArea: true,
                        color: 'rgba(189, 196, 212, 0.18)',
                        drawTicks: false,
                        lineWidth: 1
                    },

                    ticks: {
                        display: false
                    },

                    border: {
                        display: false
                    }
                }
            }
        },

        // Klik na točku prikazuje njezin tooltip
        onClick: (event, elements, chart) => {
            const activeElements = chart.getElementsAtEventForMode(
                event,
                'nearest',
                { intersect: true },
                true
            )

            if (!activeElements.length) {
                return
            } // if

            const element = activeElements[0]

            chart.setActiveElements([
                {
                    datasetIndex: element.datasetIndex,
                    index: element.index
                }
            ])

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
            )

            chart.update('none')
        }
    })

    // Pomicanje na početak nakon stvaranja grafikona
    await nextTick()
    scrollChartToStart()
} // createChart

// Ponovno stvaranje grafikona nakon promjene podataka ili filtera
async function refreshChart() {
    // Uklanjanje prethodnih instanci prije crtanja novih
    destroyCharts()

    await nextTick()
    await createChart()
} // refreshChart

// Početno stvaranje grafikona
onMounted(async () => {
    await nextTick()
    await createChart()
}) // onMounted

// Osvježavanje nakon promjene mjerenja, razdoblja ili jedinice
watch(
    [
        () => props.data,
        () => props.period,
        () => props.unit
    ],
    () => {
        refreshChart()
    },
    {
        deep: true
    }
) // watch

// Oslobađanje resursa pri napuštanju ekrana
onBeforeUnmount(() => {
    destroyCharts()
}) // onBeforeUnmount

</script>

<style scoped>
/* Glavni kontejner grafikona */
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

/* Fiksni prostor za oznake Y-osi */
.measurement-chart-y-axis {
    flex: 0 0 48px;
    width: 48px;
    height: 270px;
    overflow: hidden;
    background: transparent;    /* Prozirna pozadina */
    position: relative;
    z-index: 2;
    box-sizing: border-box;
    flex-shrink: 0;
}

/* Canvas fiksne Y-osi */
.measurement-chart-y-axis canvas {
    display: block;
    width: 48px !important;
    height: 270px !important;
    max-width: 48px;
}

/* Vertikalna linija Y-osi */
.measurement-chart-y-axis::after {
    content: '';
    position: absolute;
    top: 20px;
    right: 0;
    bottom: 28px;
    width: 1px;
    background: #52677D;
}

/* Horizontalno scrollabilni središnji dio */
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

/* Sakrivanje scrollbara */
.measurement-chart-scroll::-webkit-scrollbar {
    display: none;
}

/* Sadržaj zadržava širinu izračunatu prema mjerenjima */
.measurement-chart-scroll-content {
    height: 270px;
    flex: 0 0 auto;
    position: relative;
    box-sizing: border-box;
}

/* Glavni canvas */
.measurement-chart-scroll-content canvas {
    display: block;
    width: auto !important;
    max-width: none;
    height: 270px !important;
}

/* Fiksni završni razmak */
.measurement-chart-right-space {
    flex: 0 0 18px;
    width: 18px;
    height: 270px;
    flex-shrink: 0;
    pointer-events: none;
}

</style>