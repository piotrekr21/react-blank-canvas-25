import { Header } from "@/components/Header";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <div className="container mx-auto p-8 prose prose-slate max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          Polityka Prywatności
        </h1>
        
        <section className="mb-8">
          <h2>1. Informacje ogólne</h2>
          <p>
            Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych przekazanych przez Użytkowników w związku z korzystaniem z naszej platformy.
          </p>
        </section>

        <section className="mb-8">
          <h2>2. Administrator danych</h2>
          <p>
            Administratorem danych osobowych jest nasza platforma, która zobowiązuje się do odpowiedniego zabezpieczenia przekazanych danych osobowych.
          </p>
        </section>

        <section className="mb-8">
          <h2>3. Cel zbierania danych</h2>
          <p>
            Dane osobowe są zbierane w celu:
          </p>
          <ul>
            <li>Świadczenia usług na platformie</li>
            <li>Komunikacji z użytkownikami</li>
            <li>Poprawy jakości świadczonych usług</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>4. Prawa użytkowników</h2>
          <p>
            Użytkownicy mają prawo do:
          </p>
          <ul>
            <li>Dostępu do swoich danych</li>
            <li>Sprostowania danych</li>
            <li>Usunięcia danych</li>
            <li>Ograniczenia przetwarzania</li>
            <li>Przenoszenia danych</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;