<!-- GRAFIKON REZULTATA TESTOVA KLIJENTA -->

<template>
    <!-- Glavni kontejner grafikona -->
    <div class="test-chart">
        <!-- Fiksna lijeva Y-os -->
        <div class="test-chart-y-axis">
            <canvas ref="yAxisCanvas" width="48" height="270"> </canvas>
        </div>

        <!-- Horizontalno scrollabilni središnji dio -->
        <div ref="chartScrollContainer" class="test-chart-scroll">
            <!-- Sadržaj zadržava izračunatu širinu grafikona -->
            <div
                class="test-chart-scroll-content"
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
        <div class="test-chart-right-space" aria-hidden="true"></div>
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
] //monthLabels zagrada

// Formatiranje vrijednosti prema hrvatskim postavkama
function formatValue(value) {
    return Number(value).toLocaleString('hr-HR', {
        maximumFractionDigits: 2
    })
} // formatValue zagrada

//određivanje razumljivog koraka y-osi
function getNiceStep(rawStep) {
    //zaštita od nevaljanog ili nultog koraka
    if(!Number.isFinite(rawStep) || rawStep <=0) { return 1}

    //određivanje reda veličine koraka
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
    const normalized = rawStep / magnitude

    //odabir koraka koji se lako čita na osi
    let multiplier
    if(normalized <= 1) { multiplier = 1 }
    else if(normalized <= 2) { multiplier = 2 }
    else if(normalized <= 5) { multiplier = 5 }
    else {multiplier = 10 }

    return multiplier * magnitude
} //getNiceStep zagrada

//FUNKCIJA ZA IZRAČUN RASPONA I OZNAKA Y-OSI PREMA STVARNIM TESTOVIMA
function getAxisConfig(values){
    //zadržavanje samo konačnih brojčanih vrijednosti
    const numericValues = values
        .map(value => Number(value))
        .filter(value => Number.isFinite(value))

    //zadani raspon kada nema valjanih podataka
    if(numericValues.length === 0) {
        return {
            min: 0,
            max: 5,
            step: 1,
            ticks: [0, 1, 2, 3, 4, 5],
            gridTicks: [0, 1, 2, 3, 4, 5]
        } //return zagrada
    } //if zagrada

    //najmanja i najveća stvarna vrijednost
    const minimum = Math.min(...numericValues)
    const maximum = Math.max(...numericValues)
    const range = maximum - minimum
    //korak za uski raspon prema veličini testa
    const valueMagnitude = Math.max(Math.abs(minimum), Math.abs(maximum), 1)
    let step = valueMagnitude >=20 ? Math.pow(10, Math.floor(Math.log10(valueMagnitude / 2))) : 1
    step = Math.max(1, step)
    //povećanje koraka kod velikih raspona
    while (range / step > 6) { step = getNiceStep(step * 1.01) }

    //dodavanje prostora iznad i ispod krajnjih vrijednosti
    const axisMin = Math.floor(minimum / step) * step - step
    const axisMax = Math.ceil(maximum / step) * step + step
    
    //izrada oznaka u pravilnim cjelobrojnim razmacima
    const tickCount = Math.round((axisMax - axisMin) / step)
    const ticks = Array.from(
        {length: tickCount + 1},
        (_, index) => Math.round(axisMin + index * step)
    ) //const ticks zagrada
    //dodatne crte mreže na polovici između glavnih oznaka
    const gridStep = step / 2
    const gridTickCount = Math.round((axisMax - axisMin) / gridStep)
    const gridTicks = Array.from(
        {length: gridTickCount + 1},
        (_, index) => Number((axisMin + index * gridStep).toPrecision(12))
    ) //gridTicks zagrada
    return {
        min: axisMin,
        max: axisMax,
        step,
        ticks,
        gridTicks
    } //return zagrada
} //getAxisConfig zagrada

//FUNKCIJA ZA PRETVARANJE PODATAKA IZ BAZE U GRAFIKON
function getChartData() {
    //pretvaranje datuma i rezultata u standardizirani oblik
    const tests = props.data
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
        ) //.filter zagrada
        .sort((a, b) => a.date.localeCompare(b.date))

    //nema točaka ako nema valjanih testova
    if(tests.length === 0) { return [] }

    //za 1MJ prikaz stavlja se veći razmak između zapisa
    if(props.period === '1m') {
        const pointSpacing = 48

        return tests.map((test, index) => ({
            ...test,
            plotX: edgeSpace + index * pointSpacing
        })) //return zagrada
    } //if zagrada

    //grupiranje testova prema mjesecu i godini
    const groups = new Map()
    tests.forEach(test => {
        const date = new Date(`${test.date}T00:00:00`)
        const key = `${date.getFullYear()}-${date.getMonth()}`

        if(!groups.has(key)) { groups.set(key, []) }
        groups.get(key).push(test)
    }) //tests.forEach zagrada

    //izračun vodoravnih položaja uz razmak između mjeseci
    let cursor = edgeSpace
    const rezultat = []

    groups.forEach(group => {
        group.forEach((test, index) => {
            rezultat.push({
                ...test,
                plotX: cursor + index * monthPointGap
            }) //result.push zagrada
        }) //group.forEach zagrada

        //sljedeća skupina dobiva vlastiti prostor
        const groupWidth = Math.max(0, group.length - 1) * monthPointGap
        cursor += Math.max(monthGroupSpacing, groupWidth + monthPointGap + 24)
    }) //groups.forEach zagrada

    return rezultat
} //getChartData zagrada

//FUNKCIJA ZA FORMATIRANJE PUNOG DATUMA ZA TOOLTIP
function formatTooltipDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    //neispravan datum se ne prikazuje
    if(Number.isNaN(date.getTime())) { return '' }

    return new Intl.DateTimeFormat('hr-HR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    }).format(date)
} //formatTooltipDate zagrada

//FUNKCIJA ZA FORMATIRANJE KRATKOG DATUMA ZA VODORAVNU OS
function formatAxisDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    if(Number.isNaN(date.getTime())) { return '' }

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')

    return `${day}.${month}`
} //formatAxisDate zagrada

//FUNKCIJA ZA JEDINSTVENI KLJUČ MJESECA I GODINE
function getMonthGroupKey(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`)

    if (Number.isNaN(date.getTime())) { return null } 

    return `${date.getFullYear()}-${date.getMonth()}`
} //getMonthGroupKey zagrada

//FUNKCIJA - TEKSTUALNA OZNAKA MJESECA I GODINE
function formatMonthGroupLabel(dateValue, showYear = true) {
    const date = new Date(`${dateValue}T00:00:00`)

    if(Number.isNaN(date.getTime())) { return '' }

    const month = monthLabels[date.getMonth()]
    const year = date.getFullYear()

    return showYear ? `${month}\n${year}` : month
} //formatMonthGroupLabel

//FUNCKIJA - IZRADA JEDNE OZNAKE ZA SVAKI MJESEC
function getGroupedAxisLabel(data){
    //godine koje postoje u prikazanim testovima
    const years = new Set(
        data.map(item => {
            const date = new Date(`${item.date}T00:00:00`)
            return Number.isNaN(date.getTime())
                ? null
                : date.getFullYear()
        }).filter(year => year != null)
    ) //const years zagrada

    //godina se prikazuje samo ako podaci obuhvaćaju više godina
    const showYear = years.size > 1
    const labels = []
    const displayedGroups = new Set()

    data.forEach(item => {
        const groupKey = getMonthGroupKey(item.date)
        
        if(!groupKey || displayedGroups.has(groupKey)) { return }
        
        displayedGroups.add(groupKey)

        labels.push({
            label: formatMonthGroupLabel(item.date, showYear),
            plotX: item.plotX
        }) //labels zagrada
    }) //data.forEach zagrada

    return labels
} //getGroupedAxisLabel zagrada

//FUNKCIJA ZA IZRAČUN POTREBNE ŠIRINE GRAFIKONA
function calculateChartWidth(data) {
    //vidljiva širiran prostora za pomicanje
    const visibleWidth = Math.max(
        minimumChartWidth, 
        chartScrollContainer.value?.clientWidth || minimumChartWidth
    ) //visibleWidth zagrada

    //vodoravni položaj zadnje točke
    const lastPoint = data.length > 0
        ? Math.max(...data.map(item => item.plotX))
        : edgeSpace
    
    //dodatni prostor nakon posljednjeg testa
    const trailingSpace = props.period === '1m' ? 48 : 40
    
    chartPixelWidth.value = Math.max(
        visibleWidth,
        lastPoint + trailingSpace
    ) //chartPixelWidth zagrada
    return chartPixelWidth.value
} //calculateChartWidth zagrada

//FUNKCIJA ZA UNIŠTAVANJE GLAVNOG GRAFA
function destroyChart() {
    if(chartInstance) {
        chartInstance.destroy()
        chartInstance = null
    } //if zagrada
} //destroyChart zagrada
//FUNKCIJA ZA UNIŠTAVANJE GRAFA FIKSNE Y OSI
function destroyYAxisChart() {
    if(yAxisChartInstance) {
        yAxisChartInstance.destroy()
        yAxisChartInstance = null
    } //if zagrada
} //destroyYAxisChart zagrada
///FUNKCIJA ZA UNIŠTAVANJE SVIH AKTIVNIH GRAFIKONA
function destroyCharts() {
    destroyChart()
    destroyYAxisChart()
} //destroyCharts zagrada

//FUNKCIJA ZA POVRATAK NA POČETAK VODORAVNOG PRIKAZA
function scrollChartToStart() {
    if(!chartScrollContainer.value) { return }
    chartScrollContainer.value.scrollLeft = 0
} //scrollChartToStart zagrada

//PLUGIN ZA RUČNO ISCRTAVANJE OZNAKA DATUMA
const xAxisLabelsPlugin = {
    id: 'testXAxisLabels',

    afterDraw(chart) {
        const xScale = chart.scales.x
        if(!xScale) { return }

        const ctx = chart.ctx
        const data = chart.data.datasets?.[0]?.data || []

        //kratki datumi za mjesec, grupiranje za dulja razdoblja
        const labels = props.period === '1m'
            ? data.map(item => ({
                label: formatAxisDate(item.date),
                plotX: item.x
            }))
            : getGroupedAxisLabel(
                data.map(item => ({
                    date: item.date,
                    plotX: item.x
                })) //data.map zagrada
            ) // : getGrouped... zagrada

        ctx.save()
        ctx.fillStyle = '#BDC4D4'
        ctx.font = '700 12px sans-serif'
        ctx.textBaseline = 'top'

        labels.forEach(item => {
            if(!item.label) { return }

            const x = xScale.getPixelForValue(item.plotX)
            const y = xScale.bottom + 4

            ctx.textAlign = 'left'

            item.label.split('\n').forEach((line, lineIndex) => {
                ctx.fillText(line, x, y + lineIndex * 14)
            }) //item.label zagrada
        }) //labels.forEach zagrada

        ctx.restore()
    } //afterDraw zagrada
} //xAxisLabelsPlugin

//PLUGIN ZA RUČNO ISCRTAVANJE VRIJEDNOSTI FIKSNE Y OSI
const yAxisLabelsPlugin = {
    id: 'testYAxisLabels',

    afterDraw(chart) {
        const yScale = chart.scales.y
        if(!yScale) { return }

        const ctx = chart.ctx
        const axisConfig = chart.options.plugins.testAxisConfig
        if(!axisConfig?.ticks) { return }

        ctx.save()
        ctx.fillStyle = '#BDC4D4'
        ctx.font = '700 11px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'

        axisConfig.ticks.forEach(value => {
            const y = yScale.getPixelForValue(value)

            //oznake izvan vidljivog dijela se ne crtaju
            if(y < yScale.top - 1 || y > yScale.bottom + 1) { return }

            ctx.fillText(formatValue(value), 0 , y)
        }) //axisConfig zagrada

        ctx.restore()
    } //afterDraw zagrada
} // yAxisLabelsPlugin zagrada

//FUNKCIJA ZA STVARANJE FIKSNE Y OSI
function createYAxisChart(axisConfig) {
    //stvarne dimenzije canvasa fiksne y osi
    yAxisCanvas.value.width = 48
    yAxisCanvas.value.height = chartHeight

    //stvaranje grafikona fiksne y osi
    yAxisChartInstance = new Chart(yAxisCanvas.value, {
        type: 'line',
        plugins: [yAxisLabelsPlugin],
        data: {datasets: [] },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            events: [],
            animation: false,

            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                testAxisConfig: axisConfig
            },

            layout: {
                padding: {
                    top: chartTopSpace,
                    right: 0,
                    bottom: chartBottomSpace,
                    left: 0
                } //padding azgrada
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
                    grid: { display : false },
                    border: { display: false }
                } //y zagrada
            } //scales zagrada
        } //options zagrada
    }) // yAxisChartInstance zagrada
} //createYAxisChart zagrada

//FUNKCIJA ZA KREIRANJE GLAVNOG GRAFIKONA
async function createChart() {
    await nextTick() //čekanje prikaza canvasa elemenata

    if(!chartCanvas.value || !yAxisCanvas.value) { return }

    const chartData = getChartData() //priprema kronološki poredanih testova

    //prazan grafikon ne zadržava stare podatke
    if(chartData.length === 0) {
        destroyCharts()
        chartPixelWidth.value = minimumChartWidth
        return
    } //IF zagrada

    //izračun širine i vertikalne skale
    calculateChartWidth(chartData)

    const axisConfig = getAxisConfig( chartData.map(item => item.y))

    await nextTick() //čekanje primjene dimenzija
    createYAxisChart(axisConfig) //stvaranje fiksne y osi

    //postavljanje stvarnih dimenzija canvasa
    chartCanvas.value.width = chartPixelWidth.value
    chartCanvas.value.height = chartHeight

    //STVARANJE GLAVNOG GRAFA
    chartInstance = new Chart(chartCanvas.value, {
        type: 'line',
        plugins: [xAxisLabelsPlugin],

        data: {
            labels: [],
            datasets: [
                {
                    //vrijednosti ostaju stvarni zapisi iz baze
                    label: props.unit
                        ? `Rezultat (${props.unit})`
                        : 'Rezultat',
                    data: chartData.map(item => ({
                        x: item.plotX,
                        y: item.y,
                        date: item.date
                    })),

                    //boje i stil
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
            ] //Datasets zagrada
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
                                ? `Rezultat: ${value} ${props.unit}`
                                : `Rezultat: ${value}`
                        } //label zagrada
                    } //calbacks zagrada
                } //tooltip zagrada
            }, //plugins zagrada

            //gornji i donji razmak
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
                        chartPixelWidth.value - (props.period === '1m' ? 48 : edgeSpace)
                    ), //max zagrada
                    grid: { display: false },
                    ticks: { display: false },
                    border: {
                        display: true,
                        color: '#52677D',
                        width: 1
                    } //border zagrada
                }, //x zagrada         
            
                y: {
                    min: axisConfig.min,
                    max: axisConfig.max,

                    //mreža prati iste vrijednosti kao fiksna y os
                    afterBuildTicks(scale) {
                        scale.ticks = axisConfig.gridTicks.map(value =>  ({ value }))
                    }, //afterBuildTicks zagrada
                    grid: {
                        display: true,
                        drawOnChartArea: true,
                        color: 'rgba(189, 196, 212, 0.18)',
                        drawTicks: false,
                        lineWidth: 1
                    }, //grid zagrada
                    ticks: { display: false },
                    border: { display: false }
                } //y zagrada
            } //scales zagrada
        }, //options zagrada

        //klik na točku prikazuje njezin tooltip
        onClick: (event, elements, chart) => {
            const activeElements = chart.getElementsAtEventForMode(
                event,
                'nearest',
                { intersect: true },
                true
            )
            if(!activeElements.length) { return }

            const element = activeElements[0]

            chart.setActiveElements([
                {datasetIndex: element.datasetIndex, index: element.index }
            ])

            chart.tooltip.setActiveElements(
                [
                    { datasetIndex: element.datasetIndex, index: element.index }
                ],
                { x: element.element.x, y: element.element.y }
            )

            chart.update('none')
        } //onClick zagrada
    }) //chartInstance zagrada

    //pomicanje na početak nakon stvaranja grafa
    await nextTick()
    scrollChartToStart()
} //createChart zagrada

//FUNKCIJA ZA STVARANJE GRAFIKONA NAKON PROMJENE PODATAKA ILI FILTERA
async function refreshChart() {
    destroyCharts() //uklanjanje prethodnih instanci prije crtanja novih

    await nextTick()
    await createChart()
} //refreshChart zagrada

//POČETNO STVARANJE GRAFA
onMounted(async () => {
    await nextTick()
    await createChart()
}) //onMounted zagrada

//OSVJEŽAVANJE NAKON PROMJENE TESTA, RAZDOBLJA ILI JEDINICE
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

//oslobađanje resursa pri napuštanju ekrana
onBeforeUnmount(() => {
    destroyCharts()
}) //onBeforeUnmount zagrada

</script>

<style scoped>

/* Glavni kontejner grafikona */
.test-chart {
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
.test-chart-y-axis {
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
.test-chart-y-axis canvas {
    display: block;
    width: 48px !important;
    height: 270px !important;
    max-width: 48px;
}

/* Vertikalna linija Y-osi */
.test-chart-y-axis::after {
    content: '';
    position: absolute;
    top: 20px;
    right: 0;
    bottom: 28px;
    width: 1px;
    background: #52677D;
}

/* Horizontalno scrollabilni središnji dio */
.test-chart-scroll {
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
.test-chart-scroll::-webkit-scrollbar {
    display: none;
}

/* Sadržaj zadržava širinu izračunatu prema mjerenjima */
.test-chart-scroll-content {
    height: 270px;
    flex: 0 0 auto;
    position: relative;
    box-sizing: border-box;
}

/* Glavni canvas */
.test-chart-scroll-content canvas {
    display: block;
    width: auto !important;
    max-width: none;
    height: 270px !important;
}

/* Fiksni završni razmak */
.test-chart-right-space {
    flex: 0 0 18px;
    width: 18px;
    height: 270px;
    flex-shrink: 0;
    pointer-events: none;
}

</style>

