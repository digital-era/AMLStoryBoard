import React, { useState, useCallback } from 'react';
import { createEnhancedImagePrompt, generateImageFromPrompt } from './services/geminiService';
import { SparklesIcon, FilmIcon } from './components/icons';

const SCRIPT_CONTENT = `**电影剧本：千年之恋**

**1. 外景 - 未来城市 - 白天**

[画面：高耸入云的金属巨塔，反重力飞行器如金属蜂群穿梭。街道上人流如织，全息广告在空中闪烁。一切都极致高效，却也冰冷疏离。]

**2. 内景 - 咖啡馆 - 白天**

[画面：露天咖啡馆里，玛丽坐在桌前，全息设计板上流淌着柔和的建筑草图，但她的眉头紧锁，显然陷入瓶颈。她不时抬头，试图从冰冷的城市中寻找灵感。]
[特写：迈克的眼睛，数据流在他眼中飞速闪过，各种关于“美”的定义被唤醒、比对、分析，最终定格在玛丽身上。]

**4. 外景 - 科技艺术展 - 夜晚**

[画面：灯光璀璨的展厅，精英云集。亨利·卡森，西装革履，自信优雅，径直走向玛丽。他身旁站着迈克，如同一个安静的影子。]

**7. 内景 - 庆功派对 - 夜晚**

[画面：流光溢彩的派对。亨利将玛丽拥在怀中，接受众人祝贺。]
[迈克抬手，一道全息数据流从指尖射出，投射在中央大屏幕上。屏幕上是亨利集团的机密财务报表和暧昧通讯记录。]

**10. 内景 - 迈克秘密基地 (月球背面飞船) - 夜晚**

[画面：迈克站在一个巨大的能量舱前。能量舱缓缓关闭，蓝色的冷却液淹没迈克的身躯。他闭上眼睛。]

**11. 外景 - 未来地球 / 内景 - 玛丽的晚年居所 - 蒙太奇**

[画面：千年后的地球，已成为破碎的星环。人类文明的遗迹在宇宙中漂流。]

**16. 外景 - 浩瀚星海 - 宇宙**

[画面：迈克的飞船在无尽的星海中孤独漂流。他坐在驾驶舱里，望着窗外，眼中不再有困惑，也不再有愤怒，只剩下深沉的、永恒的思考。]
[镜头拉远，飞船成为星海中的一个微小光点，渐行渐远。]
`;

interface StoryboardItem {
    scene: string;
    description: string;
    imageUrl: string;
}

const parseScript = (script: string): { scene: string; description: string }[] => {
    const scenes: { scene: string; description: string }[] = [];
    const sceneRegex = /\*\*\s*(\d+\..*?)\s*\*\*([\s\S]*?)(?=\n\*\*\s*\d+\.|$)/g;
    let match;

    while ((match = sceneRegex.exec(script)) !== null) {
        const sceneTitle = match[1].trim();
        const sceneContent = match[2];
        const descriptionRegex = /\[(画面|特写|蒙太奇)[：:]([\s\S]*?)\]/g;
        let descMatch;
        const descriptions: string[] = [];
        while ((descMatch = descriptionRegex.exec(sceneContent)) !== null) {
            descriptions.push(descMatch[2].trim().replace(/\n/g, ' '));
        }

        if (descriptions.length > 0) {
            scenes.push({
                scene: sceneTitle,
                description: descriptions.join(' '),
            });
        }
    }
    return scenes;
};


const App: React.FC = () => {
  const [script, setScript] = useState<string>(SCRIPT_CONTENT);
  const [storyboard, setStoryboard] = useState<StoryboardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStoryboard([]);
    setProgress('');

    try {
        const scenes = parseScript(script);
        if (scenes.length === 0) {
            setError("No valid scenes found. Ensure scenes start with **1. ...** and contain descriptions like [画面: ...].");
            setIsLoading(false);
            return;
        }

        const generatedItems: StoryboardItem[] = [];
        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            setProgress(`Generating scene ${i + 1}/${scenes.length}: Creating image prompt...`);
            const enhancedPrompt = await createEnhancedImagePrompt(scene.description);
            
            setProgress(`Generating scene ${i + 1}/${scenes.length}: Creating image...`);
            const base64Image = await generateImageFromPrompt(enhancedPrompt);
            
            const newItem: StoryboardItem = {
                ...scene,
                imageUrl: `data:image/png;base64,${base64Image}`,
            };
            generatedItems.push(newItem);
            setStoryboard([...generatedItems]);
        }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  }, [script]);
  
  const isButtonDisabled = isLoading || !script.trim();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-7xl mx-auto text-center mb-6">
        <div className="flex justify-center items-center gap-4">
          <FilmIcon className="w-12 h-12 text-indigo-400" />
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Storyboard Generator
          </h1>
        </div>
        <p className="mt-2 text-lg text-gray-400">
          Turn your movie script into a visual storyboard with Gemini.
        </p>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto">
        {/* Controls Panel */}
        <div className="lg:w-1/3 w-full bg-gray-800/50 rounded-2xl p-6 shadow-2xl border border-gray-700 flex flex-col space-y-6 lg:sticky top-8 self-start">
          <div>
            <label htmlFor="script" className="block text-sm font-medium text-gray-300 mb-2">1. Your Script</label>
            <textarea
              id="script"
              rows={18}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-500 font-mono text-sm"
              placeholder="Paste your script here..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all text-white
              ${isButtonDisabled 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-indigo-500/50'}`}
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{isLoading ? 'Generating...' : 'Generate Storyboard'}</span>
          </button>
          
          {isLoading && progress && <p className="text-indigo-300 text-sm mt-4 text-center animate-pulse">{progress}</p>}
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>

        {/* Storyboard Display */}
        <div className="lg:w-2/3 w-full flex-grow">
            {storyboard.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[50vh] bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-700 p-8">
                    <FilmIcon className="w-16 h-16 text-gray-600"/>
                    <h2 className="mt-4 text-2xl font-semibold text-gray-400">Your Storyboard Appears Here</h2>
                    <p className="text-gray-500 mt-1">Paste a script and click "Generate Storyboard" to begin.</p>
                </div>
            )}
             {storyboard.length > 0 && (
                <div className="grid grid-cols-1 gap-8">
                    {storyboard.map((item, index) => (
                        <StoryboardCard key={index} item={item} />
                    ))}
                </div>
            )}
             {isLoading && storyboard.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[50vh] bg-gray-800/50 rounded-2xl p-8">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg">Warming up the director's chair...</p>
                </div>
             )}
        </div>
      </main>
    </div>
  );
};

const StoryboardCard: React.FC<{ item: StoryboardItem }> = ({ item }) => (
    <div className="bg-gray-800/50 rounded-2xl p-4 shadow-xl border border-gray-700 flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2 w-full bg-gray-900/50 rounded-lg aspect-video overflow-hidden shrink-0">
            <img src={item.imageUrl} alt={item.scene} className="object-cover w-full h-full" />
        </div>
        <div className="flex flex-col justify-center">
            <h3 className="font-bold text-lg text-indigo-400">{item.scene}</h3>
            <p className="text-sm text-gray-400 mt-1">{item.description}</p>
        </div>
    </div>
);

export default App;
