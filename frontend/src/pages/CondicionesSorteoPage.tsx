import React from 'react';

const CondicionesSorteoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-4xl font-bold text-red-600 mb-8 text-center">
            Términos y Condiciones del Sorteo
          </h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <p className="text-sm text-gray-500 italic">
              Última actualización: 17 de noviembre de 2025
            </p>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de Términos</h2>
              <p>
                Al participar en el sorteo organizado por la Asociación Chilena de Asadores (en adelante, "ACACHILE"), 
                el participante acepta expresamente estos términos y condiciones en su totalidad. La participación 
                en el sorteo implica el conocimiento y aceptación de las presentes bases.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Elegibilidad</h2>
              <p>
                Podrán participar en el sorteo todas las personas mayores de 18 años que completen correctamente 
                el formulario de registro. La participación es gratuita y no está condicionada a ninguna compra 
                o pago previo.
              </p>
              <p>
                Cada participante solo podrá registrarse una vez utilizando su RUT único. Registros duplicados 
                serán automáticamente descalificados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Recopilación y Uso de Datos Personales</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">3.1 Datos Recopilados</h3>
              <p>
                Al registrarse en el sorteo, ACACHILE recopilará los siguientes datos personales:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nombre completo (nombre y apellido)</li>
                <li>RUT (Rol Único Tributario)</li>
                <li>Correo electrónico</li>
                <li>Edad</li>
                <li>Número de teléfono</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">3.2 Finalidad del Tratamiento</h3>
              <p>
                Los datos personales proporcionados serán utilizados para las siguientes finalidades:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Gestión del sorteo:</strong> Registro de participantes, realización del sorteo y notificación de ganadores.</li>
                <li><strong>Comunicaciones relacionadas con el sorteo:</strong> Envío de información sobre el estado del sorteo, resultados y entrega de premios.</li>
                <li><strong>Marketing y promociones:</strong> Envío de información sobre eventos, actividades, noticias y promociones organizadas por ACACHILE.</li>
                <li><strong>Comunicaciones institucionales:</strong> Información sobre la asociación, sus actividades y oportunidades de participación.</li>
                <li><strong>Análisis y estadísticas:</strong> Elaboración de estadísticas agregadas y anónimas para mejorar nuestros servicios.</li>
                <li><strong>Cumplimiento legal:</strong> Cumplir con obligaciones legales y reglamentarias aplicables.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">3.3 Consentimiento</h3>
              <p>
                Al aceptar estos términos y condiciones, el participante otorga su consentimiento expreso, libre, 
                informado e inequívoco para que ACACHILE trate sus datos personales conforme a las finalidades 
                descritas anteriormente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartir y Transferencia de Datos</h2>
              <p>
                ACACHILE se compromete a no vender, alquilar o comercializar sus datos personales a terceros. 
                Sus datos podrán ser compartidos únicamente en los siguientes casos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Con proveedores de servicios tecnológicos necesarios para la operación del sorteo y la gestión de comunicaciones.</li>
                <li>Cuando sea requerido por ley o autoridad competente.</li>
                <li>Para proteger los derechos, propiedad o seguridad de ACACHILE, sus miembros o el público.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Seguridad de los Datos</h2>
              <p>
                ACACHILE implementa medidas de seguridad técnicas y organizativas apropiadas para proteger 
                sus datos personales contra acceso no autorizado, pérdida, destrucción o alteración. Sin embargo, 
                ningún sistema de transmisión por Internet o almacenamiento electrónico es 100% seguro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Derechos del Participante</h2>
              <p>
                De acuerdo con la legislación vigente sobre protección de datos personales, el participante tiene 
                derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Acceso:</strong> Conocer qué datos personales tenemos sobre usted.</li>
                <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos.</li>
                <li><strong>Cancelación:</strong> Solicitar la eliminación de sus datos personales.</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos para fines específicos, como marketing.</li>
                <li><strong>Revocación del consentimiento:</strong> Retirar su consentimiento en cualquier momento.</li>
                <li><strong>Portabilidad:</strong> Solicitar una copia de sus datos en formato estructurado y de uso común.</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, puede contactarnos a través de:
              </p>
              <ul className="list-none pl-6 space-y-1">
                <li><strong>Correo electrónico:</strong> hola@acachile.com</li>
                <li><strong>Sitio web:</strong> www.acachile.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Retención de Datos</h2>
              <p>
                Los datos personales de los participantes serán conservados durante el tiempo necesario para 
                cumplir con las finalidades para las cuales fueron recopilados, incluyendo:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Durante la vigencia del sorteo y hasta la entrega del premio al ganador.</li>
                <li>Por el plazo legalmente requerido para cumplir obligaciones fiscales y legales.</li>
                <li>Mientras el participante no solicite la eliminación de sus datos o retire su consentimiento.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Mecánica del Sorteo</h2>
              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">8.1 Período de Participación</h3>
              <p>
                El período de registro y participación en el sorteo será informado en el sitio web de ACACHILE 
                y en las comunicaciones oficiales de la asociación.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">8.2 Sorteo</h3>
              <p>
                El sorteo se realizará de manera aleatoria entre todos los participantes registrados que cumplan 
                con los requisitos establecidos. La fecha, hora y modalidad del sorteo serán comunicadas 
                oportunamente a través de nuestros canales oficiales.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">8.3 Notificación del Ganador</h3>
              <p>
                El ganador será notificado a través de los medios de contacto proporcionados en el registro 
                (correo electrónico y/o teléfono). El ganador tendrá un plazo de 15 días corridos desde la 
                notificación para reclamar su premio.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">8.4 Premio</h3>
              <p>
                Los detalles del premio serán informados en las comunicaciones oficiales del sorteo. El premio 
                no es transferible, no es canjeable por dinero en efectivo y está sujeto a disponibilidad.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Descalificación</h2>
              <p>
                ACACHILE se reserva el derecho de descalificar a cualquier participante que:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proporcione información falsa o inexacta en su registro.</li>
                <li>Intente manipular o interferir con el funcionamiento del sorteo.</li>
                <li>Viole estos términos y condiciones.</li>
                <li>Tenga múltiples registros utilizando el mismo RUT.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Responsabilidad</h2>
              <p>
                ACACHILE no se hace responsable por:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Problemas técnicos o fallas en el sistema que impidan el registro o participación.</li>
                <li>Correos electrónicos o mensajes que no lleguen al participante por problemas de su proveedor de servicios.</li>
                <li>Información de contacto incorrecta o desactualizada proporcionada por el participante.</li>
                <li>Daños o perjuicios derivados de la aceptación o uso del premio.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modificaciones</h2>
              <p>
                ACACHILE se reserva el derecho de modificar estos términos y condiciones en cualquier momento. 
                Las modificaciones entrarán en vigor desde su publicación en el sitio web. Es responsabilidad 
                del participante revisar periódicamente estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Cancelación o Suspensión</h2>
              <p>
                ACACHILE se reserva el derecho de cancelar, suspender o modificar el sorteo en caso de fuerza 
                mayor, causas técnicas, fraude, o cualquier otra circunstancia que impida su correcta realización. 
                En tal caso, se comunicará oportunamente a los participantes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Ley Aplicable y Jurisdicción</h2>
              <p>
                Estos términos y condiciones se regirán e interpretarán de acuerdo con las leyes de Chile. 
                Cualquier controversia derivada de estos términos será sometida a la jurisdicción de los 
                tribunales ordinarios de justicia competentes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contacto</h2>
              <p>
                Para cualquier consulta, duda o solicitud relacionada con estos términos y condiciones o el 
                tratamiento de sus datos personales, puede contactarnos en:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg mt-4">
                <p><strong>Asociación Chilena de Asadores (ACACHILE)</strong></p>
                <p><strong>Correo electrónico:</strong> hola@acachile.com</p>
                <p><strong>Sitio web:</strong> www.acachile.com</p>
              </div>
            </section>

            <div className="border-t-2 border-gray-200 pt-6 mt-8">
              <p className="text-center text-gray-600">
                Al participar en el sorteo, usted declara haber leído, comprendido y aceptado estos términos 
                y condiciones en su totalidad.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/participa"
              className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Volver al Formulario de Participación
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CondicionesSorteoPage;
