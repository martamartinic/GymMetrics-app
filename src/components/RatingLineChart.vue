<!-- KOMPONENTA GRAFIKONA OCJENE TRENINGA ODABRANE VRSTE TRENINGA KROZ VRIJEME NA EKRANU CLIENTDETAILSPAGE -->

<template>
  <!-- GLAVNI KONTEJNER GRAFIKONA -->
  <div ref="chartRoot" class="rating-chart" >

    <!-- FIKSNI LIJEVI DIO GRAFIKONA SA Y OSI -->
    <div class="rating-chart-y-axis">
      <!-- CANVAS FIKSNE Y OSI -->
      <canvas ref="yAxisCanvas"></canvas>
    </div>

    <!-- HORIZONTALNO SCROLLABILNI SREDIŠNJI DIO -->
    <div ref="chartScrollContainer" class="rating-chart-scroll" >
      <!-- KONTEJNER KOJI ZADRŽAVA STVARNU ŠIRINU GRAFIKONA KOJA MOŽE BITI VEĆA OD EKRANA -->
      <div class="rating-chart-scroll-content" :style="{   width: `${chartPixelWidth}px` }" >
        <!-- GLAVNI CANVAS GRAFIKONA -->
        <canvas ref="chartCanvas" :width="chartPixelWidth" :height="chartHeight" > </canvas>
      </div>

    </div>
    <!-- FIKSNI DESNI PRAZNI PROSTOR KOJI SE NE POMIČE SA GRAFIKONOM --> 
    <div class="rating-chart-right-space" aria-hidden="true"></div>
    
</div>

</template>

<script setup>

import { nextTick, onBeforeUnmount, onMounted,  ref,  watch} from 'vue' // Uvoz Vue funkcija potrebnih za rad s canvas elementima i praćenje promjena
import Chart from 'chart.js/auto' // Uvoz Chart.js biblioteke

// Podaci koje komponenta prima od roditeljskog ekrana
const props = defineProps({
  // Popis ocjena treninga
  data: { type: Array, default: () => [] },
  // Trenutno odabrano vremensko razdoblje
  period: {type: String, default: '1m' }
}) //defineProps zagrada

// REFERENCA NA GLAVNI KONTEJNER GRAFIKONA
// Referenca na glavni element koji promatra IntersectionObserver
const chartRoot = ref(null)

// REFERENCA NA CANVAS ELEMENTE
// Referenca na canvas glavnog grafikona
const chartCanvas = ref(null)
// Referenca na canvas fiksne Y osi
const yAxisCanvas = ref(null)
// Referenca na horizontalno scrollabilni kontejner
const chartScrollContainer = ref(null)

// REFERENCA NA CHART.JS INSTANCE
// Referenca na trenutno aktivni glavni grafikon
let chartInstance = null
// Referenca na trenutno aktivni grafikon Y osi
let yAxisChartInstance = null
// Referenca na IntersectionObserver
let intersectionObserver = null
// Referenca na timer druge faze početne animacije
let fillAnimationTimer = null

// STANJE VIDLJIVOSTI I ANIMACIJE
// Oznaka je li graf trenutno vidljiv na ekranu
const chartIsVisible = ref(false)
// Oznaka je li graf već jednom stvoren
const chartHasBeenCreated = ref(false)
// Oznaka čeka li promjena podataka da graf postane vidljiv
const pendingVisibleUpdate = ref(false)
// Podaci koji čekaju prikaz nakon što graf ponovno postane vidljiv
let pendingChartData = null

// POSTAVKE DIMENZIJA
const minimumChartWidth = 320  // Minimalna širina grafikona kada nema dovoljno podataka za horizontalni scroll
const pointSpacing = 20   // Prostor koji jedna točka dobiva na horizontalnoj osi (pr. 30  * 4 točkr = 120px prostora)
const chartHeight = 270   // ukupna visina grafikona
const chartTopSpace = 20  //visina gornjeg prostora iznad grafa
const chartBottomSpace = 38 //visina donjeg prostora ispod x osi
const edgeSpace = 18
const monthPointGap = 17
const monthGroupSpacing = 76

// TRAJANJE ANIMACIJA
const initialLineAnimationDuration = 500   // Trajanje početnog crtanja linije i točaka
const initialFillAnimationDuration = 450  // Trajanje druge faze početne animacije ispune
const updateAnimationDuration = 400    // Trajanje animacije promjene podataka

// TRENUTNA ŠIRINA GRAFIKONA
// Širina grafikona kao broj potreban canvas elementu
const chartPixelWidth = ref(minimumChartWidth)

// FUNKCIJA ZA PRETVARANJE PODATAKA IZ PROPSA U CHART.JS FORMAT
function getChartData() {
// priprema podataka i pretvaranje ocjene u brojeve
    const trainings = props.data
    .map(training => ({
      date: training.date,
      y: Number(training.rating)
    }))
    .filter(training =>
      training.date &&
      Number.isFinite(training.y) &&
      !Number.isNaN(
        new Date(`${training.date}T00:00:00`).getTime()
      )
    )
    .sort((a, b) => a.date.localeCompare(b.date)) //kronološki redoslijed treninga

  if (!trainings.length) return []  //ako nema treninga ne prikazuju se ni točke

  // Filter 1 MJ 
  if (props.period === '1m') {
    const oneMonthPointSpacing = 48 //veći razmak između datuma da se oznake ne preklapaju
    return trainings.map((training, index) => ({
      ...training,
      plotX: edgeSpace + index * oneMonthPointSpacing
    })) //return zagrada
  } //if zagrada

  // Ostali filteri grupiraju treninge prema mjesecu i godini
  const groups = new Map()

  trainings.forEach(training => {
    const date = new Date(`${training.date}T00:00:00`)
    const key = `${date.getFullYear()}-${date.getMonth()}`

    if (!groups.has(key)) { groups.set(key, []) }

    groups.get(key).push(training)
  }) //trainings.forEach zagrada

  let cursor = edgeSpace
  const result = []

  groups.forEach(group => {
    const groupWidth = Math.max(0, group.length - 1 ) * monthPointGap

    group.forEach((training, index) => {
      result.push({
        ...training,
        plotX: cursor + index * monthPointGap
      }) //result.push zagrada
    }) //group.forEach zagrada

    // razmak između grupa mjeseci 
    cursor += Math.max( monthGroupSpacing, groupWidth + monthPointGap + 24 )
  }) //groups.forEach zagrada

  return result
  
} //getChartData zagrada

// FUNKCIJA ZA FORMATIRANJE DATUMA ZA TOOLTIP
function formatTooltipDate(dateValue) {
  // Pretvaranje datuma iz baze u Date objekt
  const date = new Date(`${dateValue}T00:00:00`)

  // Provjera je li datum valjan
  if(Number.isNaN(date.getTime())) {
    return ''
  } //if zagrada

  // Prikaz punog datuma u hrvatskom formatu
  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)

} //formatTooltipDate zagrada

// FUNKCIJA ZA FORMATIRANJE KRATKOG DATUMA
function formatAxisDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`)   // Pretvaranje datuma iz baze u Date objekt
  if(Number.isNaN(date.getTime())) { return '' }  // Provjera je li datum valjan

  const day = String(date.getDate()).padStart(2, '0')         // Dohvat dana
  const month = String(date.getMonth() + 1).padStart(2, '0')  // Dohvat mjeseca
  return `${day}.${month}`    // Vraćanje datuma u obliku DD.MM

} //formatAxisDate zagrada

//Nazivi mjeseci za oznake x osi
const monthLabels = ['SIJ', 'VELJ', 'OŽU', 'TRA', 'SVI', 'LIP', 'SRP', 'KOL', 'RUJ', 'LIS', 'STU', 'PRO' ]

//FUNKCIJA DOHVATA OZNAKA MJESECA I GODINE IZ DATUMA
function getMonthGroupKey(dateValue){
  const date = new Date(`${dateValue}T00:00:00`) //pretvaranje datuma u Date objekt 
  if(Number.isNaN(date.getTime())) { return null }   // Provjera valjanosti datuma
  return `${date.getFullYear()}-${date.getMonth()}`   // Jedinstveni ključ mjeseca i godine
} // getMonthGroupKey zagrada

//FUNKCIJA ZA DOHVAT TEKSTUALNE OZNAKE MJESECA I GODINE
function formatMonthGroupLabel(dateValue, showYear = true) {
  const date = new Date(`${dateValue}T00:00:00`)   // Pretvaranje datuma u Date objekt
  if(Number.isNaN(date.getTime())) { return '' }   // Provjera valjanosti datuma
  const month = monthLabels[date.getMonth()]  // Dohvat naziva mjeseca
  const year = date.getFullYear()   // Dohvat godine
  if(!showYear) { return month }  // Povrat mjeseca bez godine kada godina nije potrebna
  return `${month}\n${year}` // Prikaz mjeseca i godine u dva retka
} //formatMonthGroupLabel zagrada

//FUNKCIJA ZA IZRADU JEDNE OZNAKE ZA SVAKI MJESEC
function getGroupedAxisLabels(data){
  // Skup svih godina prisutnih u prikazanim podacima
  const years = new Set(
    data
      .map(item => {
        // Datum se sada nalazi u polju date, a ne x
        const date = new Date(`${item.date}T00:00:00`)

        // Neispravni datumi ne ulaze u skup godina
        return Number.isNaN(date.getTime())
          ? null
          : date.getFullYear()
      }) //.map zagrada
      .filter(year => year !== null)
  ) //const years zagrada

  // Godina se prikazuje samo ako podaci obuhvaćaju više godina
  const showYear = years.size > 1
  // Oznake će sadržavati tekst i stvarnu horizontalnu poziciju
  const labels = []
  // Skup već obrađenih mjeseci i godina
  const displayedGroups = new Set()
  // Prolazak kroz sve točke kronološkim redom
  data.forEach(item => {
    // Dohvat ključa mjeseca i godine iz datuma treninga
    const groupKey = getMonthGroupKey(item.date)
    // Preskakanje neispravnog datuma
    if (!groupKey) { return }
    // Za isti mjesec i godinu crtamo samo jednu oznaku
    if (displayedGroups.has(groupKey)) { return }
    // Pamćenje već obrađenog mjeseca
    displayedGroups.add(groupKey)
    // Spremanje oznake i pozicije prve točke mjeseca
    labels.push({
      label: formatMonthGroupLabel(item.date, showYear),
      plotX: item.plotX,
      groupKey
    }) //labels.push zagrada

  }) // data.forEach zagrada

  // Povrat oznaka mjeseci
  return labels

} //getGroupedAxisLabels zagrada

// FUNKCIJA ZA IZRAČUN ŠIRINE GRAFIKONA
function calculateChartWidth(data) {
    //provjera je li ulazni parametar niz podataka
    const chartData = Array.isArray(data) ? data : [] 
    // Dohvat širine vidljivog prostora za grafikon 
    const visibleWidth = Math.max( minimumChartWidth, chartScrollContainer.value?.clientWidth || minimumChartWidth ) 
    // položaj zadnje točke //Pronalazak najveće horizontalne pozicije svih točaka 
    const lastPoint = chartData.length > 0 ? Math.max(...chartData.map(item => item.plotX)) : edgeSpace 
   //dodatni prostor iza zadnje točke - kod filtra 1MJ koristi se veći razmak jer su točke udaljenije, ostali filtri dodano 40px da bi zadnja točka bila cijela
   const trailingSpace = props.period === '1m' ? 48 : 40 ///edgeSpace
    // Dodavanje praznog prostora iza posljednje točke 
    const calculatedWidth = lastPoint + trailingSpace //edgeSpace 
    // Odabir širine koja odgovara vidljivom prostoru i podacima 
    chartPixelWidth.value = Math.max( visibleWidth, calculatedWidth ) 
    // Vraćanje izračunate širine grafikona 
    return chartPixelWidth.value 
} //calculateChartWidth zagrada

// FUNKCIJA ZA UNIŠTAVANJE GLAVNOG GRAFIKONA
function destroyChart() {
  // Provjera postoji li glavni grafikon
  if(chartInstance) {
    // Oslobađanje Chart.js resursa
    chartInstance.destroy()
    // Uklanjanje reference
    chartInstance = null
  } //if zagrada
} //destroyChart zagrada

// FUNKCIJA ZA UNIŠTAVANJE Y OSI
function destroyYAxisChart() {
  // Provjera postoji li grafikon Y osi
  if(yAxisChartInstance) {
    // Oslobađanje Chart.js resursa
    yAxisChartInstance.destroy()
    // Uklanjanje reference
    yAxisChartInstance = null
  } //if zagrada
} //destroyYAxisChart zagrada

// FUNKCIJA ZA UNIŠTAVANJE SVIH GRAFIKONA
function destroyCharts() {
  // Uništavanje glavnog grafikona
  destroyChart()
  // Uništavanje grafikona Y osi
  destroyYAxisChart()
} //destroyCharts zagrada

// FUNKCIJA ZA POMAK NA GRAFA NA POČETNI LIJEVI POLOŽAJ
function scrollChartToStart() {
  if(!chartScrollContainer.value) {return}  // Provjera postoji li scrollabilni kontejner
  //chartScrollContainer.value.scrollLeft = chartScrollContainer.value.scrollWidth  // Pomicanje na krajnji desni dio grafikona
  chartScrollContainer.value.scrollLeft = 0
} //scrollChartToLatest zagrada

// PLUGIN ZA KOSO ISCRTAVANJE X OZNAKA
const xAxisLabelsPlugin = {  
  // Jedinstveni naziv plugina
  id: 'xAxisLabels',
  // Iscrtavanje oznaka nakon crtanja grafikona
  afterDraw(chart) {
    // Dohvat linearne X skale
    const xScale = chart.scales.x
    // Prekid ako X skala ne postoji
    if (!xScale) { return }
    // Dohvat konteksta canvasa
    const ctx = chart.ctx
    // Dohvat stvarnih podataka prvog skupa
    const data = chart.data.datasets?.[0]?.data || []
    // Priprema oznaka ovisno o odabranom razdoblju
    const labels = props.period === '1m'
      // Za 1 mjesec prikazujemo datum svakog treninga
      ? data.map(item => ({
          label: formatAxisDate(item.date),
          plotX: item.x
        })) //data.map zagrada
      // Za dulja razdoblja prikazujemo jednu oznaku po mjesecu
      : getGroupedAxisLabels(
          data.map(item => ({
            date: item.date,
            plotX: item.x
          })) //data.map zagrada
        ) //getGroupedAxisLabels zagrada
    // Postavljanje boje teksta oznaka
    ctx.fillStyle = '#BDC4D4'
    // Postavljanje fonta oznaka
    ctx.font = '700 12px sans-serif'
    // Oznake se poravnavaju okomito od gornjeg ruba
    ctx.textBaseline = 'top'

    // Prolazak kroz oznake koje treba nacrtati
    labels.forEach((item) => {
      // Preskakanje praznih oznaka
      if (!item.label) { return }
      // Pretvaranje stvarne vrijednosti X u položaj na canvasu
      const x = xScale.getPixelForValue(item.plotX)
      // Oznake se crtaju ispod donje granice X osi
      const y = xScale.bottom + 4
      // Razdvajanje mjeseca i godine u retke ako postoji novi red
      const labelLines = item.label.split('\n')
      // Spremanje trenutnog stanja canvasa
      ctx.save()
      ctx.textAlign = 'left'
      // Poravnanje teksta prema vrhu
      ctx.textBaseline = 'top'
      // Iscrtavanje svakog retka oznake
      labelLines.forEach((line, lineIndex) => {
        ctx.fillText( line, x, y + lineIndex * 14 )
      }) //labelLines.forEach zagrada
      // Vraćanje prethodnog stanja canvasa
      ctx.restore()
    }) // labels.forEach zagrada
  } // afterDraw zagrada  
} //xAxisLabelsPlugin zagrada

//PLUGIN ZA Y OS - RUČNO ISCRTAVANJE FIKSNIH Y OZNAKA (OCJENA)
const yAxisLabelsPlugin = {
  id: 'yAxisLabels', // Jedinstveni ID plugina 
  afterDraw(chart) { // Iscrtavanje oznaka nakon grafikona 
    const yScale = chart.scales.y // Dohvat Y skale 
    if(!yScale) { return } // Prekid ako skala ne postoji 
    
    const ctx = chart.ctx // Dohvat canvasa 
    ctx.save() // Spremanje stanja canvasa 
    ctx.fillStyle = '#BDC4D4' // Boja oznaka 
    ctx.font = '700 12px sans-serif' 
    ctx.textAlign = 'left' // Poravnanje prema desnoj strani
    ctx.textBaseline = 'middle' // Vertikalno centriranje oznaka 
    ;[1, 2, 3, 4, 5].forEach(value => { // Iscrtavanje ocjena 1–5 
      const y = yScale.getPixelForValue(value) // Vertikalni položaj stvarne ocjene 
      ctx.fillText(String(value), 0,y) // Početak oznake na lijevom rubu Y canvasa
    }) // forEach zagrada 
    ctx.restore() // Vraćanje stanja canvasa 
  } //afterDraw zagrada
} //yAxisLabelsPlugin zagrada

// FUNKCIJA ZA STVARANJE FIKSNE Y OSI
function createYAxisChart() {
  // Provjera postoji li canvas Y osi
  if(!yAxisCanvas.value) { return } //if zagrada
  // Ako već postoji Y grafikon, uništava se prije stvaranja novog
  destroyYAxisChart()
  // Stvaranje grafikona koji služi samo za fiksnu Y os
  yAxisChartInstance = new Chart(yAxisCanvas.value, {
    plugins: [yAxisLabelsPlugin], //prikaz ručno pozicioniranih y oznaka(ocjena)
    // Vrsta grafikona
    type: 'line',
    // Y grafikon nema vlastite podatke
    data: { datasets: [] },
    // Postavke grafikona
    options: {
      // Prilagodba dostupnoj širini
      responsive: true,
      // Visina prati roditeljski kontejner
      maintainAspectRatio: false,
      // Isključivanje interakcije
      events: [],
      // Isključivanje animacije Y osi
      animation: false,
      // Postavke dodatnih elemenata
      plugins: {
        // Sakrivanje legende
        legend: { display: false },
        // Sakrivanje tooltipsa
        tooltip: { enabled: false }
      }, //plugins zagrada
      // Prostor mora odgovarati glavnom grafikonu
      layout: {
        padding: {
          top: chartTopSpace, //8,
          right: 0, //2,
          bottom: chartBottomSpace, //0,
          left: 0
        } //padding zagrada
      }, //layout zagrada
      scales: {         // Postavke skala
        x: {display: false },  // X os nije potrebna
        y: {  // Fiksna Y os
          min: 0.7,         // Mala rezerva ispod oznake/ocjene 1 kako bi se vidjela cijela točka       
          max: 5.2,       // Maksimalna vrijednost ostavlja prostor iznad ocjene 5   
          position: 'left',        // Oznake su na lijevoj strani      
          ticks: {     // Oznake Y osi           
            color: '#BDC4D4',   // Boja oznaka        
            font: {size: 12, weight:  '700' },      // Veličina oznaka
            align: 'center',  //centriranje oznaka unutar lijevog prostora
            crossAlign: 'center', //centriranje oznaka prema y osi
            //padding: 0, //uklanjanje dodatnog unutarnjeg razmaka
            display: false, //automatski tekst zamijenit će se ručno nacrtanim oznakama radi bolje preglednosti
            stepSize: 1,  // Razmak između ocjena
            callback: value => { // Oznaka 5.2 se ne prikazuje
              if(value < 1 || value > 5) {return ''} //if zagrada  // Sakrivanje vrijednosti iznad 5 i ispod 1
              return value              // Prikaz stvarne ocjene
            } //callback zagrada
          }, //ticks zagrada          
          grid: {display: false }, // Na Y osi nema mreže       
          border: {display: false }    // Lijeva os nema vlastiti Chart.js obrub
        } //y zagrada
      } //scales zagrada
    } //options zagrada
  }) //new Chart zagrada
} //createYAxisChart zagrada

// FUNKCIJA ZA STVARANJE GLAVNOG GRAFIKONA
async function createChart(initialAnimation = true) {
  // Čekanje Vue prikaza canvas elemenata
  await nextTick()
  // Provjera postoje li canvas elementi
  if(!chartCanvas.value || !yAxisCanvas.value) { return } //if zagrada
  // Dohvat podataka koji već sadrže datum, ocjenu i plotX poziciju
  const chartData = getChartData()
  // Ako nema valjanih podataka, uklanjamo postojeće grafikone
  if (chartData.length === 0) {
    // Uništavanje eventualnih starih grafikona
    destroyCharts()
    // Vraćanje minimalne širine canvasa
    chartPixelWidth.value = minimumChartWidth
    // Označavanje da grafikon još nije stvoren
    chartHasBeenCreated.value = false
    // Prekid funkcije jer nema podataka za prikaz
    return
  } // if zagrada
  // Izračun širine na temelju stvarnih horizontalnih pozicija točaka
  calculateChartWidth(chartData)
  // Čekanje da Vue primijeni novu širinu canvasa
  await nextTick()
  // Ako grafikon već postoji, ne stvaramo novu instancu
  if (chartInstance) { return } // if zagrada
  // Stvaranje fiksne Y osi
  createYAxisChart()

  // Postavi stvarne dimenzije canvasa prije stvaranja Chart.js instance 
  chartCanvas.value.width = chartPixelWidth.value 
  chartCanvas.value.height = chartHeight

  // Stvaranje glavnog grafikona
  chartInstance = new Chart(chartCanvas.value, {
    // Vrsta grafikona
    type: 'line',
    plugins: [xAxisLabelsPlugin], //registracija plugina za kose oznake X osi
    // Podaci grafikona
    data: {
      // Oznake su ručno iscrtane pluginom pa ne trebamo kategorijske oznake
      labels: [],
      // Skup podataka koji prikazuje ocjene treninga
      datasets: [
        {
          // Naziv skupa podataka
          label: 'Ocjena treninga',
          // Linearna X skala koristi plotX, a tooltip koristi izvorni datum
          data: chartData.map(item => ({
            x: item.plotX,
            y: item.y,
            date: item.date
          })), //data: chartData.map zagrada
          // Boja linije
          borderColor: '#52677D',
          // Početna prozirna ispuna tijekom animacije
          backgroundColor: initialAnimation
            ? 'rgba(82, 103, 125, 0)'
            : 'rgba(82, 103, 125, 0.12)',
          // Debljina linije
          borderWidth: 2,
          // Blaga zakrivljenost linije
          tension: 0.18,
          // Prikaz ispune ispod linije
          fill: true,
          // Veličina obične točke
          pointRadius: 4,
          // Boja unutrašnjosti točke
          pointBackgroundColor: '#6A85A1',
          // Boja obruba točke
          pointBorderColor: '#6A85A1',
          // Debljina obruba točke
          pointBorderWidth: 1.5,
          // Povećano područje za dodir
          pointHitRadius: 18,
          // Veličina aktivne točke
          pointHoverRadius: 6,
          // Boja aktivne točke
          pointHoverBackgroundColor: '#52677D',
          // Boja obruba aktivne točke
          pointHoverBorderColor: '#52677D',
          // Debljina obruba aktivne točke
          pointHoverBorderWidth: 2
        } // dataset zagrada
      ] // datasets zagrada
    }, //data zagrada

    // POSTAVKE GRAFIKONA
    options: {
      // Glavni graf ima unaprijed određenu širinu
      responsive: false,
      // Visina se određuje preko canvas atributa
      maintainAspectRatio: false,
      // Reakcija samo na klik
      events: ['click'],
      // Pronalaženje najbliže točke
      interaction: {
        mode: 'nearest',
        intersect: true
      }, //interaction zagrada
      // Početna animacija
      animation: initialAnimation
        ? {
            duration: initialLineAnimationDuration,
            easing: 'easeOutQuart'
          }
        : false,
      // Dodatni elementi
      plugins: {
        // Legenda nije potrebna
        legend: { display: false },
        // Postavke tooltipsa
        tooltip: {
          // Tooltip je uključen
          enabled: true,
          // Pozadina tooltipsa
          backgroundColor: '#1C2E4A',
          // Boja naslova
          titleColor: '#BDC4D4',
          // Boja vrijednosti
          bodyColor: '#BDC4D4',
          // Unutarnji razmak
          padding: 10,
          // Zaobljeni rubovi
          cornerRadius: 8,
          // Sadržaj tooltipsa
          callbacks: {
            // Prikaz punog datuma
            title: items => {
              // Dohvat podatka o datumu
             // const dateValue = items[0]?.raw?.x
             const dateValue = items[0]?.raw?.date
              // Ako datum ne postoji nema naslova
              if(!dateValue) { return '' } //if zagrada
              // Prikaz punog datuma
              return formatTooltipDate(dateValue)
            }, //title zagrada

            // Prikaz ocjene
            label: context => {
              // Prikaz ocjene s jednom decimalom
              return `Ocjena: ${Number( context.parsed.y ).toFixed(1)}`
            } //label zagrada
          } //callbacks zagrada
        } //tooltip zagrada
      }, //plugins zagrada

      // Prostor grafikona - razmaci unutar grafikona
      layout: {
        padding: {
          top: chartTopSpace, 
          right: pointSpacing / 2, 
          bottom: chartBottomSpace, 
          left: 0
        } //padding zagrada
      }, //layout zagrada
      // SKALE
      scales: {
         x: {
          // Linearna os omogućuje vlastite pozicije treninga
          type: 'linear',
          // Početak osi
          min: 0,
          // Kraj osi prati širinu canvasa
         // max: chartPixelWidth.value - edgeSpace,
         max: Math.max(1, chartPixelWidth.value - (props.period === '1m' ? 48 : edgeSpace) ),
          // Uklanjanje okomitih mrežnih linija
          grid: {display: false },
          // Oznake ručno crta xAxisLabelsPlugin
          ticks: { display: false  },
          // Vidljiva donja linija osi
          border: {
            display: true,
            color: '#52677D',
            width: 1
          } //border zagrada
        }, //x zagrada

        // Y SKALA GLAVNOG GRAFIKONA
        y: {         
          min: 0.7,  // mala rezerva ispod ocjene 1 kako bi cijela točka bila vidljiva      
          max: 5.2,  // Maksimalna vrijednost 
          // Postavke vodoravnih mrežnih linija
          grid: {
            // Uključivanje mreže
            display: true,
            // Mreža se crta preko cijelog grafikona
            drawOnChartArea: true,
            // Boja mrežnih linija
            color: 'rgba(189, 196, 212, 0.18)',
            // Bez malih oznaka na Y osi
            drawTicks: false,
            // Crte su malo tanje
            lineWidth: 1
          }, //grid zagrada
          // Glavne oznake su skrivene jer su na fiksnom canvasu
          ticks: { 
            display: false, // Skriven tekst Y osi 
            // uklanjanje Lijevog obruba y osi
            border: {display: false }
          }, //ticks zagrada
        } //y zagrada
      } //scales zagrada
    }, //options zagrada
    // Tap na točku grafikona
    onClick: (event, elements, chart) => {
      // Ponovno traženje najbliže točke
      const activeElements = chart.getElementsAtEventForMode(
          event, 'nearest', {intersect: true },
          true
        ) //const activeElements zagrada
      // Ako nema točke prekida se obrada
      if(!activeElements.length) { return } //if zagrada
      // Dohvat odabrane točke
      const element = activeElements[0]
      // Postavljanje aktivne točke
      chart.setActiveElements([
        {
          datasetIndex: element.datasetIndex,
          index: element.index
        } 
      ]) //chart zagrada
      // Postavljanje tooltipsa na odabranu točku
      chart.tooltip.setActiveElements(
        [ {
            datasetIndex: element.datasetIndex,
            index: element.index
          } ],
        {
          x: element.element.x,
          y: element.element.y
        }
      ) //chart.tooltip zagrada
      // Osvježavanje bez dodatne animacije
      chart.update('none')
    } //onClick zagrada
  }) //new Chart zagrada
  // Oznaka da je graf stvoren
  chartHasBeenCreated.value = true
  // Čekanje prikaza grafikona
  await nextTick()
  // Pomicanje na početni lijevi položaj
  scrollChartToStart()
  // Početna animacija ispune
  if(initialAnimation) {
    // Zaustavljanje prethodnog timera
    if(fillAnimationTimer) { clearTimeout(fillAnimationTimer) } //if zagrada
    // Pokretanje druge faze nakon crtanja linije
    fillAnimationTimer = setTimeout(() => {
      // Provjera postoji li graf
      if(!chartInstance) { return } //if zagrada
      // Dohvat prvog skupa podataka
      const dataset = chartInstance.data.datasets[0]
      // Postavljanje završne prozirnosti ispune
      dataset.backgroundColor = 'rgba(82, 103, 125, 0.12)'
      // Animacija samo promjene ispune
      chartInstance.update({ 
        duration: initialFillAnimationDuration,
        easing:'easeOutQuart'
      }) //charInstance.update zagrada
    }, initialLineAnimationDuration)
  } //if zagrada

} //createChart zagrada

// FUNKCIJA ZA AŽURIRANJE POSTOJEĆEG GRAFIKONA
async function updateExistingChart( chartData, animate = true ) { 
    // Prekid ako grafikon još nije stvoren
  if (!chartInstance) { return }
  // Zatvaranje trenutno aktivne točke i tooltipsa
  chartInstance.setActiveElements([])
  chartInstance.tooltip?.setActiveElements([], { x: 0, y: 0 })
  // Uklanjanje prethodnog aktivnog stanja bez animacije
  chartInstance.update('none')
  // Izračun nove širine prema novim horizontalnim pozicijama
  calculateChartWidth(chartData)
  // Čekanje da Vue primijeni širinu canvasa
  await nextTick()
  // Ažuriranje podataka s numeričkom X pozicijom i izvornim datumom
  chartInstance.data.datasets[0].data = chartData.map(item => ({
    x: item.plotX,
    y: item.y,
    date: item.date
  })) //chartInstance.data.datasets zagrada
  // Oznake osi iscrtava vlastiti plugin
  chartInstance.data.labels = []
  // Ažuriranje granice X skale nakon promjene širine
  chartInstance.options.scales.x.min = 0
  chartInstance.options.scales.x.max = Math.max (1, chartPixelWidth.value - (props.period === '1m' ? 48 : edgeSpace)) //chartPixelWidth.value - edgeSpace
  // Ponovno određivanje veličine grafikona
  chartInstance.resize(chartPixelWidth.value, chartHeight)
  // Animirano ažuriranje kada je grafikon vidljiv
  if (animate) {
    // Animacija promjene linije i točaka
    chartInstance.update({
      duration: updateAnimationDuration,
      easing: 'easeOutQuart'
    }) // chartInstance.update zagrada
  } else {
    // Ažuriranje bez animacije kada animacija nije potrebna
    chartInstance.update('none')
  } // else zagrada
  // Čekanje završetka ažuriranja
  await nextTick()
  // Vraćanje horizontalnog pomaka na početak
  scrollChartToStart() 
} //updateExistingChart zagrada

// FUNKCIJA ZA POSTAVLJANJE PROMJENE KOJA ČEKA VIDLJIVOST
function queueDataUpdate() {
  // Dohvat najnovijih podataka
  const latestData = getChartData()
  // Spremanje najnovijih podataka za kasniji prikaz
  pendingChartData = latestData
  // Ako graf nije stvoren još, početni prikaz će ga napraviti
  if(!chartInstance) { 
    pendingVisibleUpdate.value = true
    return
  } //if zagrada
  // Ako graf trenutno nije vidljiv, promjena se odgađa
  if(!chartIsVisible.value) {
    pendingVisibleUpdate.value = true
    return  } //if zagrada

  // Ako je graf vidljiv, promjena se odmah animira
  updateExistingChart( latestData, true )
} //queueDataUpdate zagrada

// FUNKCIJA ZA POSTAVLJANJE INTERSECTION OBSERVERA
function setupIntersectionObserver() {
  // Provjera podržava li uređaj IntersectionObserver
  if(!('IntersectionObserver' in window)) {
    // Graf se stvara odmah ako uređaj nema observer
    chartIsVisible.value = true
    // Dohvat podataka
    const data = getChartData()
    // Ako postoje podaci, stvara se početni graf
    if(data.length > 0) {
      pendingChartData = data
      createChart(true)
    } //if zagrada
    // Prekid funkcije
    return
  } //if zagrada

  // Stvaranje IntersectionObservera
  intersectionObserver = new IntersectionObserver( entries => {
        // Dohvat prvog rezultata
        const entry = entries[0]
        // Ažuriranje informacije o vidljivosti
        chartIsVisible.value = entry.isIntersecting
        // Ako graf ulazi u vidljivo područje
        if(entry.isIntersecting) {
          // Dohvat najnovijih podataka
          const latestData = pendingChartData || getChartData()
          // Ako graf još nije stvoren
          if(!chartInstance) {
            // Spremanje najnovijih podataka
            pendingChartData = latestData
            // Stvaranje grafikona s početnom animacijom
            createChart(true)
            // Promjena više ne čeka
            pendingVisibleUpdate.value = false
            // Prekid trenutne grane
            return
          } //if zagrada

          // Ako postoji odgođena promjena
          if( pendingVisibleUpdate.value && latestData ) {
            // Primjena promjene s animacijom
            updateExistingChart( latestData, true ) 
            // Uklanjanje čekanja
            pendingVisibleUpdate.value = false
          } //if zagrada
        } //if zagrada
      },
      {      
        threshold: 0.15 // Pokretanje kada je vidljiv manji dio grafikona
      }
    ) //intersectionObserver

  // Promatranje glavnog kontejnera
  if(chartRoot.value) {intersectionObserver.observe( chartRoot.value ) } //if zagrada
} //setupIntersectionObserver zagrada

// POČETNO UČITAVANJE GRAFIKONA
onMounted(async () => {
  // Čekanje da Vue iscrta elemente
  await nextTick()
  // Postavljanje promatranja vidljivosti
  setupIntersectionObserver()
}) //onMounted zagrada

// PRAĆENJE PROMJENE PODATAKA I FILTERA
watch( [ () => props.data, () => props.period ],
  () => {
    // Promjena se sprema dok se ne odredi trenutna vidljivost
    queueDataUpdate()
  }, { deep: true }
) //watch zagrada

// OSLobađanje RESURSA PRI NAPUŠTANJU EKRANA
onBeforeUnmount(() => {
  // Zaustavljanje IntersectionObservera
  intersectionObserver?.disconnect()
  // Zaustavljanje timera animacije
  if(fillAnimationTimer) {
    clearTimeout(fillAnimationTimer)
  } //if zagrada
  // Uništavanje Chart.js instanci
  destroyCharts()
}) //onBeforeUnmount zagrada

</script>

<style scoped>

/* GLAVNI KONTEJNER GRAFIKONA */
.rating-chart {  
  width: 100%; /* Grafikon zauzima cijelu širinu roditeljskog kontejnera */
  max-width: 100%; /* grafikon ne smije bit širi od roditelja */
  min-width: 0; /* omogućuje pravilno smanjivanje sadržaja */
  height: 270px;  /* Fiksna visina grafikona */
  display: flex;   /* Y os i središnji dio stoje vodoravno */
  overflow: hidden;    /* Sprječavanje izlaska grafikona iz vlastitog kontejnera */
  position: relative;   /* Pozicioniranje kontejnera */  
  box-sizing: border-box;  /* Uključivanje obruba u dimenzije */
}

/* FIKSNA Y OS */
.rating-chart-y-axis {  
  flex: 0 0 28px; /* Fiksna širina prostora za oznake Y osi */
  width: 28px; /* širina ostaje na 42px */
  height: 270px;    /* Visina prati grafikon */
  overflow: hidden;    /* Oznake ne smiju izaći izvan vlastitog prostora */
  background: transparent;    /* Prozirna pozadina */
  position: relative;    /* Y os ostaje fiksna */
  z-index: 2;    /* Y os ostaje iznad scrollabilnog dijela */
  /*border-right: 1px solid #52677D;    /* desni rub y osi --> Vidljiva vertikalna Y os */
  box-sizing: border-box;    /* by model --> Uključivanje obruba u širinu */
  flex-shrink: 0; /* sprječavanje smanjivanja  */
}

/* CANVAS FIKSNE Y OSI */
.rating-chart-y-axis canvas {
  width: 28px !important;    /* Canvas zauzima stvarnu širinu fiksne Y osi */
  height: 270px !important;    /* Canvas zauzima cijelu visinu */
  display: block;    /* Blok prikaz */
  max-width: 28px; /* spriječavanje povećanja canvasa */
}
/* VIDLJIVA VERTIKALNA LINIJA Y OSI */
.rating-chart-y-axis::after {
  content: '';   /*sadržaj potreban za pseudo element */
  position: absolute;  /*pozicioniranje linije unutar y osi */
  top: 20px;  /*razmak od gornjeg obruba do početka linije */
  right: 0; /*poravnanje uz desni rub y osi */
  bottom: 28px; /*završetak linije na razini x osi */
  width: 1px; /*debljina linije */
  background: #52677D; /*boja linije y osi */
}

/* SREDIŠNJI SCROLLABILNI DIO */
.rating-chart-scroll {
  flex: 1 1 auto;   /* Središnji dio zauzima sav prostor koji ostane nakon y osi*/
  min-width: 0;    /* Omogućavanje smanjivanja flex elementa */
  width: 0; /* ne smije biti širi od roditelja */
  overflow-x: auto;    /* Horizontalni scroll je omogućen */
  overflow-y: hidden;    /* vertikalni scroll nije potreban //Vertikalni scroll pripada cijeloj stranici */
  -webkit-overflow-scrolling: touch;  /* mobilno horizontalno pomicanje */
  scrollbar-width: none;    /* Sakrivanje scrollbara */
  position: relative;    /* Pozicioniranje */ 
  box-sizing: border-box;   /* Sprječavanje izlaska središnjeg dijela iz roditelja */
}
/* SAKRIVANJE SCROLLBARA NA WEBKIT PREGLEDNICIMA */
.rating-chart-scroll::-webkit-scrollbar {  
  display: none; /* Scrollbar se vizualno ne prikazuje */
}
/* STVARNA ŠIRINA GRAFIKONA */
.rating-chart-scroll-content { 
  height: 270px;   /* Visina prati glavni grafikon */
  flex: 0 0 auto;    /* Sadržaj se ne smije smanjiti */
  position: relative;   /* Pozicioniranje */
  box-sizing: border-box;    /* Uključivanje box modela */
 /* min-width: 100%; /* širina dolazi iz vue style atributa */
}
/* GLAVNI CANVAS */
.rating-chart-scroll-content canvas {  
  display: block;  /* canvas je blok elemente //Canvas zadržava stvarnu širinu */
  width: auto !important;    /* Canvas zadržava stvarnu širinu */
  max-width: none; /* canvas ne smije prijeći definiranu širinu */
  height: 270px !important;    /* fiksna visina */
}
/* FIKSNI DESNI PRAZNI PROSTOR */ 
.rating-chart-right-space { 
    flex: 0 0 18px; /* Rezerviranje vidljivog prostora na desnom rubu */ 
    width: 18px; /* Širina završnog razmaka */ 
    height: 270px; /* Visina prati grafikon */ 
    flex-shrink: 0; /* Razmak ostaje vidljiv i ne smanjuje se */ 
    pointer-events: none; /* Razmak ne presreće interakcije s grafikonom */ 
}

</style>