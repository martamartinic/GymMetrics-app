<!-- GRAF ZA PRIKAZ TLAKA KLIJENTA -->

<template>
    <!-- Glavni kontejner grafikona -->
    <div class="health-chart">

        <!-- Fiksna lijeva Y-os -->
        <div class="health-chart-y-axis">
            <canvas ref="yAxisCanvas" width="48" height="270"></canvas>
        </div>

        <!-- Horizontalno scrollabilni dio -->
        <div ref="chartScrollContainer" class="health-chart-scroll">
            <div
                class="health-chart-scroll-content"
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
        <div class="health-chart-right-space" aria-hidden="true"></div>
    
    </div>
</template>

<script setup>

// Vue funkcije za životni ciklus i praćenje promjena
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Chart.js služi za crtanje grafikona
import Chart from 'chart.js/auto'

// Podaci koje komponenta prima od roditeljskog ekrana
const props = defineProps({
    // Popis mjerenja krvnog tlaka
    data: {
        type: Array,
        default: () => []
    },

    // Odabrano vremensko razdoblje
    period: {
        type: String,
        default: '1m'
    }
})

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
const chartTopSpace = 34 //20
const chartBottomSpace = 38
const edgeSpace = 18
const rightEndSpace = 90
const pointGap = 22          // razmak između mjerenja istog dana
const dateGroupSpacing = 50 // minimalni razmak između grupa različitih datuma

// Širina grafikona prema broju i položaju mjerenja
const chartPixelWidth = ref(minimumChartWidth)

// Nazivi mjeseci za oznake vodoravne osi
const monthLabels = [
    'SIJ', 'VELJ', 'OŽU', 'TRA', 'SVI', 'LIP',
    'SRP', 'KOL', 'RUJ', 'LIS', 'STU', 'PRO'
]

// Formatiranje brojčanih vrijednosti
function formatValue(value) {
    return Number(value).toLocaleString('hr-HR', {
        maximumFractionDigits: 0
    })
} // formatValue

// Određivanje razumljivog koraka Y-osi
function getNiceStep(rawStep) {
    if (!Number.isFinite(rawStep) || rawStep <= 0) { return 1 }

    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
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
    } //else zagrada

    return multiplier * magnitude
} // getNiceStep

// Izračun raspona i oznaka Y-osi prema stvarnim vrijednostima tlaka
function getAxisConfig(values) {
    const numericValues = values
        .map(value => Number(value))
        .filter(value => Number.isFinite(value))

    if (numericValues.length === 0) {
        return {
            min: 0,
            max: 5,
            ticks: [0, 1, 2, 3, 4, 5],
            gridTicks: [0, 1, 2, 3, 4, 5]
        } //return zagrada
    } //if zagrada

    const minimum = Math.min(...numericValues)
    const maximum = Math.max(...numericValues)
    const range = maximum - minimum

    const valueMagnitude = Math.max(
        Math.abs(minimum),
        Math.abs(maximum),
        1
    )

    let step = valueMagnitude >= 20
        ? Math.pow(10, Math.floor(Math.log10(valueMagnitude / 2)))
        : 1

    step = Math.max(1, step)

    while (range / step > 6) { step = getNiceStep(step * 1.01) }

    const axisMin = Math.floor(minimum / step) * step - step
    const axisMax = Math.ceil(maximum / step) * step + step

    const tickCount = Math.round((axisMax - axisMin) / step)

    const ticks = Array.from(
        { length: tickCount + 1 },
        (_, index) => Math.round(axisMin + index * step)
    )

    const gridStep = step / 2
    const gridTickCount = Math.round((axisMax - axisMin) / gridStep)

    const gridTicks = Array.from(
        { length: gridTickCount + 1 },
        (_, index) => Number(
            (axisMin + index * gridStep).toPrecision(12)
        )
    )

    return {
        min: axisMin,
        max: axisMax,
        ticks,
        gridTicks
    }
} // getAxisConfig

// Pretvaranje podataka iz baze u format grafikona
function getChartData() {
    const measurements = props.data
        .map(item => ({
            id: item.id,
            date: String(item.date ?? ''),
            systolic: Number(item.sistolickiTlak),
            diastolic: Number(item.dijastolickiTlak)
        }))
        .filter(item =>
            item.date &&
            Number.isFinite(item.systolic) &&
            Number.isFinite(item.diastolic) &&
            !Number.isNaN(
                new Date(`${item.date}T00:00:00`).getTime()
            )
        )
        .sort((a, b) => a.date.localeCompare(b.date))

    if (measurements.length === 0) { return [] }

    // Grupiranje mjerenja prema točnom datumu
    const groups = new Map()

    measurements.forEach(measurement => {
        if (!groups.has(measurement.date)) {
            groups.set(measurement.date, [])
        } //if zagrada

        groups.get(measurement.date).push(measurement)
    })

    // Izračun vodoravnih položaja točaka
    let cursor = edgeSpace
    const result = []

    groups.forEach(group => {
        group.forEach((measurement, index) => {
            result.push({
                ...measurement,
                plotX: cursor + index * pointGap
            })
        })

        const groupWidth = Math.max(0, group.length - 1) * pointGap

        cursor += Math.max(
            dateGroupSpacing,
            groupWidth + pointGap + 24
        )
    }) //groups.forEach zagrada

    return result
} // getChartData

// Formatiranje punog datuma za tooltip
function formatTooltipDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    if (Number.isNaN(date.getTime())) { return '' }

    return new Intl.DateTimeFormat('hr-HR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date)
} // formatTooltipDate

// Formatiranje kratkog datuma za vodoravnu os
function formatAxisDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    if (Number.isNaN(date.getTime())) { return '' }

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')

    return `${day}.${month}`
} // formatAxisDate

// Jedinstveni ključ mjeseca i godine
function getMonthGroupKey(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    if (Number.isNaN(date.getTime())) { return null }

    return `${date.getFullYear()}-${date.getMonth()}`
} // getMonthGroupKey

// Tekstualna oznaka mjeseca i godine
function formatMonthGroupLabel(dateValue, showYear = true) {
    const date = new Date(`${dateValue}T00:00:00`)

    if (Number.isNaN(date.getTime())) { return '' }

    const month = monthLabels[date.getMonth()]
    const year = date.getFullYear()

    return showYear ? `${month}\n${year}` : month
} // formatMonthGroupLabel

// Izrada jedne oznake za svaki mjesec
function getGroupedAxisLabels(data) {
    const years = new Set(
        data.map(item => {
            const date = new Date(`${item.date}T00:00:00`)

            return Number.isNaN(date.getTime())
                ? null
                : date.getFullYear()
        }).filter(year => year !== null)
    ) // const years zagrada

    const showYear = years.size > 1
    const labels = []
    const displayedGroups = new Set()

    data.forEach(item => {
        const groupKey = getMonthGroupKey(item.date)

        if (!groupKey || displayedGroups.has(groupKey)) {
            return
        }

        displayedGroups.add(groupKey)

        labels.push({
            label: formatMonthGroupLabel(item.date, showYear),
            plotX: item.plotX
        })
    }) //data.forEach zagrada

    return labels
} // getGroupedAxisLabels

// Izračun potrebne širine grafikona
function calculateChartWidth(data) {
    const visibleWidth = Math.max(
        minimumChartWidth,
        chartScrollContainer.value?.clientWidth || minimumChartWidth
    )

    const lastPoint = data.length > 0
        ? Math.max(...data.map(item => item.plotX))
        : edgeSpace

    chartPixelWidth.value = Math.max(
        visibleWidth,
        lastPoint + rightEndSpace //48
    )

    return chartPixelWidth.value
} // calculateChartWidth

// Uništavanje glavnog grafikona
function destroyChart() {
    if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
    }
} // destroyChart

// Uništavanje grafikona fiksne Y-osi
function destroyYAxisChart() {
    if (yAxisChartInstance) {
        yAxisChartInstance.destroy()
        yAxisChartInstance = null
    }
} // destroyYAxisChart

// Uništavanje svih aktivnih grafikona
function destroyCharts() {
    destroyChart()
    destroyYAxisChart()
} // destroyCharts

// Povratak na početak vodoravnog prikaza
function scrollChartToStart() {
    if (!chartScrollContainer.value) { return }

    chartScrollContainer.value.scrollLeft = 0
} // scrollChartToStart

// Plugin za oznake datuma na X-osi
const xAxisLabelsPlugin = {
    id: 'healthXAxisLabels',

    afterDraw(chart) {
        const xScale = chart.scales.x

        if (!xScale) { return }

        const ctx = chart.ctx
        const data = chart.data.datasets?.[0]?.data || []

        const labels = props.period === '1m'
            ? data
                .filter((item, index, array) =>
                    array.findIndex(entry => entry.date === item.date) === index
                )
                .map(item => ({
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
        ctx.textAlign = 'left'

        labels.forEach(item => {
            if (!item.label) {
                return
            }

            const x = xScale.getPixelForValue(item.plotX)
            const y = xScale.bottom + 4

            item.label.split('\n').forEach((line, lineIndex) => {
                ctx.fillText(line, x, y + lineIndex * 14)
            })
        })

        ctx.restore()
    } //afterDraw zagrada
} // xAxisLabelsPlugin

// Plugin za Y-os
const yAxisLabelsPlugin = {
    id: 'healthYAxisLabels',

    afterDraw(chart) {
        const yScale = chart.scales.y

        if (!yScale) { return }

        const ctx = chart.ctx
        const axisConfig = chart.options.plugins.healthAxisConfig

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
            }

            ctx.fillText(formatValue(value), 0, y)
        })

        ctx.restore()
    } //afterDraw zagrada
} // yAxisLabelsPlugin

// Plugin za okomite poveznice sistoličkog i dijastoličkog tlaka
const pressureRangePlugin = {
    id: 'healthPressureRange',

    afterDatasetsDraw(chart) {
        const systolicPoints = chart.getDatasetMeta(0).data
        const diastolicPoints = chart.getDatasetMeta(1).data

        const ctx = chart.ctx

        ctx.save()
        ctx.strokeStyle = '#6A85A1'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.65

        systolicPoints.forEach((systolicPoint, index) => {
            const diastolicPoint = diastolicPoints[index]

            if (!systolicPoint || !diastolicPoint) { return }

            ctx.beginPath()
            ctx.moveTo(systolicPoint.x, systolicPoint.y)
            ctx.lineTo(diastolicPoint.x, diastolicPoint.y)
            ctx.stroke()
        })

        ctx.restore()
    } //afterDatasetsDraw zagrada
} // pressureRangePlugin

// Plugin za prikaz ukupne vrijednosti tlaka iznad sistoličke točke
const pressureValueLabelsPlugin = {
    id: 'healthPressureValueLabels',

    afterDatasetsDraw(chart) {
        const systolicPoints = chart.getDatasetMeta(0).data
        const ctx = chart.ctx
        const data = chart.data.datasets[0]?.data || []

        ctx.save()
        ctx.fillStyle = '#BDC4D4'
        ctx.font = '700 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'

        systolicPoints.forEach((point, index) => {
            const measurement = data[index]

            if (!point || !measurement) { return }

            const label = `${formatValue(measurement.y)}/${formatValue(measurement.diastolic)}`

            ctx.fillText(
                label,
                point.x,
                point.y - 9
            )
        })

        ctx.restore()
    } //afterDatasetsDraw zagrada
} // pressureValueLabelsPlugin

// Stvaranje fiksne Y-osi
function createYAxisChart(axisConfig) {
    yAxisCanvas.value.width = 48
    yAxisCanvas.value.height = chartHeight

    yAxisChartInstance = new Chart(yAxisCanvas.value, {
        type: 'line',
        plugins: [yAxisLabelsPlugin],

        data: { datasets: []  },

        options: {
            responsive: false,
            maintainAspectRatio: false,
            events: [],
            animation: false,

            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                healthAxisConfig: axisConfig
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
                }, //x zagrada

                y: {
                    min: axisConfig.min,
                    max: axisConfig.max,
                    ticks: { display: false },
                    grid: { display: false },
                    border: { display: false }
                } //y zagrada
            } //scales zagrada
        } //options zagrada
    }) //yAxisChartInstance zagrada
} // createYAxisChart

// Stvaranje glavnog grafikona
async function createChart() {
    await nextTick()

    if (!chartCanvas.value || !yAxisCanvas.value) { return }

    const chartData = getChartData()

    if (chartData.length === 0) {
        destroyCharts()
        chartPixelWidth.value = minimumChartWidth
        return
    }

    calculateChartWidth(chartData)

    const axisConfig = getAxisConfig([
        ...chartData.map(item => item.systolic),
        ...chartData.map(item => item.diastolic)
    ])

    await nextTick()

    createYAxisChart(axisConfig)

    chartCanvas.value.width = chartPixelWidth.value
    chartCanvas.value.height = chartHeight

    const systolicData = chartData.map(item => ({
        x: item.plotX,
        y: item.systolic,
        date: item.date,
        //pressureType: 'Sistolički tlak'
        systolic: item.systolic,
        diastolic: item.diastolic
    }))

    const diastolicData = chartData.map(item => ({
        x: item.plotX,
        y: item.diastolic,
        date: item.date,
       // pressureType: 'Dijastolički tlak'
        systolic: item.systolic,
        diastolic: item.diastolic
    }))

    chartInstance = new Chart(chartCanvas.value, {
        type: 'line',

        plugins: [
            xAxisLabelsPlugin,
            pressureRangePlugin,
            pressureValueLabelsPlugin
        ], //plugins zagrada

        data: {
            labels: [],

            datasets: [
                {
                    label: 'Sistolički tlak',
                    data: systolicData,

                    showLine: true, //false,
                    borderColor:  'transparent', //'rgba(82, 103, 125, 0.35)',
                    backgroundColor: 'rgba(82, 103, 125, 0.12)', //'#6A85A1', 
                    borderWidth: 0, //2,
                    tension: 0.18,
                  //  fill: false,
 
                    fill: {
                        target: 1,
                        above: 'rgba(82, 103, 125, 0.14)',
                        below: 'rgba(82, 103, 125, 0.14)'
                    },

                    pointRadius: 4,
                    pointBackgroundColor: '#52677D',
                    pointBorderColor: '#6A85A1',
                    pointBorderWidth: 1.5,
                    pointHitRadius: 18
                },

                {
                    label: 'Dijastolički tlak',
                    data: diastolicData,

                    showLine: true, //false,
                    borderColor: 'transparent', //'rgba(82, 103, 125, 0.35)',
                    backgroundColor: '#6A85A1', //'rgba(82, 103, 125, 0.12)',
                    borderWidth: 0, //2,
                    tension: 0.18,
                    fill: false,

                    pointRadius: 4,
                    pointBackgroundColor: '#6A85A1',
                    pointBorderColor: '#6A85A1',
                    pointBorderWidth: 1.5,
                    pointHitRadius: 18
                }
            ] //datasets zagrada
        }, // data zagrada

        options: {
            responsive: false,
            maintainAspectRatio: false,
            events: ['click'],

            interaction: {
                mode: 'nearest',
                intersect: true
            },

            animation: { duration: 0 },

            plugins: {
                filler: { propagate: false  },
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

                            return dateValue
                                ? formatTooltipDate(dateValue)
                                : ''
                        },

                        label: context => {
                            const value = formatValue(context.parsed.y)

                            return `${context.dataset.label}: ${value}`
                        }
                    } //callbacks zagrada
                } //tooltip zagrada
            }, //plugins zagrada

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
                        chartPixelWidth.value - 48
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

        // Dodir na točku prikazuje obje vrijednosti istog mjerenja
        onClick: (event, elements, chart) => {
            const activeElements = chart.getElementsAtEventForMode(
                event,
                'nearest',
                { intersect: true },
                true
            )

            if (!activeElements.length) { return }

            const selectedElement = activeElements[0]
            const selectedIndex = selectedElement.index

            // Aktiviranje obiju vrijednosti odabranog mjerenja
            chart.setActiveElements([
                {
                    datasetIndex: 0,
                    index: selectedIndex
                },
                {
                    datasetIndex: 1,
                    index: selectedIndex
                }
            ])

            // Prikaz obje vrijednosti u tooltipu
            const systolicPoint = chart.getDatasetMeta(0).data[selectedIndex]
            const diastolicPoint = chart.getDatasetMeta(1).data[selectedIndex]

            chart.tooltip.setActiveElements(
                [
                    {
                        datasetIndex: 0,
                        index: selectedIndex
                    },
                    {
                        datasetIndex: 1,
                        index: selectedIndex
                    }
                ],
                {
                    x: systolicPoint.x,
                    y: (systolicPoint.y + diastolicPoint.y) / 2
                }
            )

            chart.update('none')
        } //onClick zagrada
    }) //chartInstance zagrada

    await nextTick()
    scrollChartToStart()
} // createChart

// Ponovno stvaranje grafikona nakon promjene podataka ili filtera
async function refreshChart() {
    destroyCharts()

    await nextTick()
    await createChart()
} // refreshChart

// Početno stvaranje grafikona
onMounted(async () => {
    await nextTick()
    await createChart()
}) // onMounted

// Osvježavanje nakon promjene podataka ili razdoblja
watch(
    [
        () => props.data,
        () => props.period
    ],
    () => {
        refreshChart()
    },
    { deep: true }
) // watch

// Oslobađanje resursa pri napuštanju ekrana
onBeforeUnmount(() => {
    destroyCharts()
}) // onBeforeUnmount

</script>

<style scoped>

/* Glavni kontejner grafikona */
.health-chart {
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
.health-chart-y-axis {
    flex: 0 0 48px;
    width: 48px;
    height: 270px;
    overflow: hidden;
    background: transparent;
    position: relative;
    z-index: 2;
    box-sizing: border-box;
    flex-shrink: 0;
}

/* Canvas fiksne Y-osi */
.health-chart-y-axis canvas {
    display: block;
    width: 48px !important;
    height: 270px !important;
    max-width: 48px;
}

/* Vertikalna linija Y-osi */
.health-chart-y-axis::after {
    content: '';
    position: absolute;
    top: 20px;
    right: 0;
    bottom: 28px;
    width: 1px;
    background: #52677D;
}

/* Horizontalno scrollabilni dio */
.health-chart-scroll {
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
.health-chart-scroll::-webkit-scrollbar {
    display: none;
}

/* Sadržaj zadržava izračunatu širinu */
.health-chart-scroll-content {
    height: 270px;
    flex: 0 0 auto;
    position: relative;
    box-sizing: border-box;
}

/* Glavni canvas */
.health-chart-scroll-content canvas {
    display: block;
    width: auto !important;
    max-width: none;
    height: 270px !important;
}

/* Fiksni završni razmak */
.health-chart-right-space {
    flex: 0 0 18px;
    width: 18px;
    height: 270px;
    flex-shrink: 0;
    pointer-events: none;
}

</style>
