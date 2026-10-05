<template>
 <!-- <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center"> -->
  <div class="error-page">
    <div>
      <div class="header1"> 404 </div>

      <div class="header2"> PAGE NOT FOUND </div>
      <div class="buttons-container">
        <q-btn
          class="home-button"
          color="primary"
          unelevated
          rounded
          to="/"
          label="Home"
          no-caps
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

.error-page {
  height: 100%;  /* Stranica zauzima raspoloživu visinu */
  background: var(--q-dark-page);
}
/*NASLOV 404 */
.header1{
  margin-top: 80px;
  text-align: center;
  font-size: 60px;
  font-weight: 500;
}
/*NASLOV 2 PAGE NOT FOUND */
.header2{
  margin-top: 20px;
  text-align: center;
  font-size: 50px;
  font-weight: 500;
}

/*GUMB HOME */
.buttons-container{
  flex-shrink: 0;
  padding: 8px 12px 12px;
  box-sizing: border-box;
  margin-top: 70px;
}
.home-button{
  width: 100%;
  height:52px;
  font-size:18px;
}

</style>
