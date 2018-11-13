import { Component } from '@angular/core';

declare var BrowserPrint: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private printer = null;
  private availablePrinters = null;
  public textToPrint;

  constructor(){
    this.initPrinter( );
    this.textToPrint = null;
  }
  
  private initPrinter(){
    BrowserPrint.getDefaultDevice('printer', ( printer ) => {
      console.log( printer );
      if((printer != null) && printer.connection != undefined ){
        this.printer = printer;
      } else {
        console.error("No se encontró printer");
      }
      
      /** Este método sí se da cuenta cuando falta un dispositivo */
      BrowserPrint.getLocalDevices(( printers ) => {
        console.log( printers );
      }, undefined /**Función sí tiene problemas para encontrar un dispositivo */,
      'printer'/**Dispositivo el cual estoy buscando */);
    }, (error) => { /**Función sí hay problemas para detectar dispositivos */

    });
  }
  
  public print(){
    this.checkPrintStatus( ( status ) => {

      this.printer.send( 
        this.getBarcodeText( this.textToPrint ), 
        () => {
          alert( "Terminamos de imprimir");
        },
        () => {
          console.log( "Error al tratar de imprimier")  
        }
      );      
    }); 
  }

  private checkPrintStatus( callback:any ){
    let status 
    this.printer.sendThenRead(
      "~HQES",  /** Comando que se le envia a la impresora */
      /** Función que recibe la información de la impresora */
      ( printResponse ) => {
        let status = this.evalHQES( printResponse );
        if( status == 'READY_TO_PRINT') {
            if( callback ) callback( status );
        }
      /** Función que maneja un erro sí es que al enviar la info
       * ocurrió algo inesperado */
      }, ( error ) => {
        console.error('Error al mandar un comando a la impresora', error);
      }
    );
  }

  private evalHQES( HQES_RESPONSE:string ) {
    console.log( HQES_RESPONSE );
    let statuses:string[] = [];
    let flagError = HQES_RESPONSE.charAt( 70 );
    let nibbleMedia = HQES_RESPONSE.charAt( 88 );
    let nibbleHead = HQES_RESPONSE.charAt( 87 );
    let nibblePause = HQES_RESPONSE.charAt( 84 );
    let ok = false;
    
    if ( flagError == '0' ) {
      statuses.push("READY_TO_PRINT")
      ok = true;
    }

    if (nibbleMedia == '1') statuses.push("Paper out");
    if (nibbleMedia == '2') statuses.push("Ribbon Out");
    if (nibbleMedia == '4') statuses.push("Media Door Open");
    // if (nibbleMedia == '8') statuses.push("Cutter Fault");
    if (nibbleHead == '1') statuses.push("PrintnibbleHead Overheating");
    if (nibbleHead == '2') statuses.push("Motor Overheating");
    if (nibbleHead == '4') statuses.push("PrintnibbleHead Fault");
    if (nibbleHead == '8') statuses.push("Incorrect PrintnibbleHead");
    if (nibblePause == '1') statuses.push("Printer Paused");    
    if ((!ok) && (statuses.length == 0)) statuses.push("Error: Unknown Error");    

    return statuses.join();
  }

  private getBarcodeText(text:string):string{
    return `^XA
        ^FO50, 80^ADN, 11, 7
        ^BCN, 80, Y, Y, N^FD${text}^FS
        ^XZ`;
  }


} 
