import { Header } from "@/components/Header";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <div className="container mx-auto p-8 prose prose-slate max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          Regulamin
        </h1>
        
        <section className="mb-8">
          <h2>1. Postanowienia ogólne</h2>
          <p>
            Niniejszy regulamin określa zasady korzystania z platformy, prawa i obowiązki użytkowników oraz administratora.
          </p>
        </section>

        <section className="mb-8">
          <h2>2. Definicje</h2>
          <ul>
            <li>Platforma - serwis internetowy udostępniający usługi</li>
            <li>Użytkownik - osoba korzystająca z Platformy</li>
            <li>Konto - zbiór zasobów i uprawnień przypisanych Użytkownikowi</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>3. Zasady korzystania z platformy</h2>
          <p>
            Użytkownik zobowiązuje się do:
          </p>
          <ul>
            <li>Przestrzegania przepisów prawa</li>
            <li>Poszanowania praw innych użytkowników</li>
            <li>Nienaruszania zasad współżycia społecznego</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2>4. Odpowiedzialność</h2>
          <p>
            Administrator nie ponosi odpowiedzialności za:
          </p>
          <ul>
            <li>Treści zamieszczane przez użytkowników</li>
            <li>Przerwy w działaniu platformy wynikające z przyczyn technicznych</li>
            <li>Działania osób trzecich</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Terms;