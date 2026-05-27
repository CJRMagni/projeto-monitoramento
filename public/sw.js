self.addEventListener('install', event => {

   console.log("SW instalado");

});

self.addEventListener('fetch', event => {

});

self.addEventListener(
   'notificationclick',
   function(event){

      event.notification.close();

      event.waitUntil(

         clients.openWindow(
            event.notification.data.url
         )

      );

   }
);