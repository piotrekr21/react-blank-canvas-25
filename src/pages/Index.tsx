import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center px-4"
      >
        <h1 className="text-4xl font-bold mb-4 text-foreground">Welcome to Your New App</h1>
        <p className="text-xl text-muted-foreground">Start building something amazing</p>
      </motion.div>
    </div>
  );
};

export default Index;