import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Plus, Trash2, TrendingUp, PieChartIcon, Euro, Banknote, LayoutDashboard, CalendarDays, Eye, X } from 'lucide-react'; 

// Lista de Categorias de Investimento em ordem alfabética
const INVESTMENT_CATEGORIES = [
    'Ações',
    'Certificados',
    'Depósitos a prazo',
    'ETFs',
    'Fundo de investimentos',
    'Obrigações',
    'PPR',
    'Poupança'
];

// Categorias que DEVEM ter um nome específico (ex: Ticker ou Nome da Ação/Fundo)
const CATEGORIES_REQUIRING_NAME = ['Ações', 'ETFs', 'Fundo de investimentos', 'Obrigações'];


// Função para formatar números exclusivamente em EUR (€)
const formatCurrencyEUR = (value) => {
    return new Intl.NumberFormat('de-DE', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

// Mapeamento de cores para as categorias
const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const categoryColors = {};
INVESTMENT_CATEGORIES.forEach((cat, index) => {
    categoryColors[cat] = colors[index % colors.length];
});


// --------------------------------------------------------------------------------
// --- DEFINIÇÃO DE ESTILOS INLINE (MOVIDO PARA CIMA PARA RESOLVER ReferenceError) ---
// --------------------------------------------------------------------------------
const styles = {
    // Cores e Fundos
    background: '#0f172a', // Cor de fundo principal (slate-900)
    cardBackground: '#1e293b', // Cor dos cards internos (slate-800)
    inputBackground: '#334155', // Cor dos inputs e sub-cards (slate-700)
    whiteText: '#ffffff',
    grayText: '#94a3b8', // Cor de texto suave (slate-400)
    primaryBlue: '#3b82f6', // Cor azul principal
    secondaryBlue: '#2563eb', // Cor azul de destaque
    
    // Layout
    container: {
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        padding: '32px',
    },
    mainContent: {
        maxWidth: '960px',
        margin: '0 auto',
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px',
        padding: '32px 0',
    },
    // Cards
    card: {
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
        padding: '24px',
        marginBottom: '24px',
    },
    whiteCard: { // Card principal "Adicionar"
        backgroundColor: '#ffffff',
        color: '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
        padding: '32px',
        marginBottom: '32px',
    },
    // Componentes
    input: {
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #475569',
        borderRadius: '8px',
        backgroundColor: '#334155',
        color: '#ffffff',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: 'white',
        color: '#1e293b',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: '600',
        fontSize: '18px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    // Grid (Simulação)
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
    },
    // ESTILOS PARA O CALENDÁRIO
    monthGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        padding: '12px',
        backgroundColor: '#1e293b', // Cor de fundo do card (escuro)
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
        width: '240px', // Largura fixa para a grade
    },
    monthButton: (isSelected) => ({
        padding: '8px 4px',
        fontSize: '12px',
        fontWeight: '600',
        textAlign: 'center',
        borderRadius: '4px',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#3b82f6' : '#334155', // Azul primário ou cinza escuro
        color: isSelected ? '#ffffff' : '#94a3b8',
        transition: 'background-color 0.1s',
        border: '1px solid transparent',
        boxSizing: 'border-box',
    }),
    // ESTILOS PARA MODAL
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    modalContent: {
        backgroundColor: '#1e293b', // Usa o cardBackground diretamente
        padding: '32px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.8)',
        color: '#ffffff', // Usa o whiteText diretamente
        position: 'relative'
    }
};
// --- FIM DOS ESTILOS ---

// --- FUNÇÃO DE AGREGAÇÃO DE DADOS PARA O GRÁFICO DE PIZZA (AGRUPA POR 'category') ---
const aggregatePieData = (investments) => {
    const aggregated = {};
    
    investments.forEach((inv) => {
        const category = inv.category; 
        
        if (aggregated[category]) {
            aggregated[category] += inv.value;
        } else {
            aggregated[category] = inv.value;
        }
    });

    return Object.keys(aggregated).map((category) => ({
        name: category, 
        value: aggregated[category],
        color: categoryColors[category] || colors[0] 
    }));
};
// --- FIM DA FUNÇÃO DE AGREGAÇÃO PIE ---


// --- FUNÇÃO: AGREGAÇÃO DE DADOS PARA A LISTA DE ATIVOS (AGRUPA POR 'category' + 'name') ---
const aggregateAssetData = (investments, totalValue) => {
    const aggregated = {};

    investments.forEach((inv) => {
        // Concatenação simples para a chave
        const key = inv.category + '-' + inv.name; 
        
        if (aggregated[key]) {
            aggregated[key].value += inv.value;
            aggregated[key].individualIds.push(inv.id);
        } else {
            aggregated[key] = {
                category: inv.category,
                name: inv.name,
                value: inv.value,
                color: categoryColors[inv.category] || colors[0],
                individualIds: [inv.id] 
            };
        }
    });

    return Object.values(aggregated).map(asset => ({
        ...asset,
        percentage: totalValue === 0 ? 0 : ((asset.value / totalValue) * 100).toFixed(2),
    }));
};
// --- FIM DA FUNÇÃO DE AGREGAÇÃO ASSET ---


// --- NOVO COMPONENTE: DETALHES DO MÊS ---
const MonthDetailModal = ({ monthData, onClose }) => {
    if (!monthData) return null;

    // Calcula os dados agregados para este mês (snapshot)
    const totalValue = monthData.investments.reduce((sum, inv) => sum + inv.value, 0);
    const aggregatedAssets = aggregateAssetData(monthData.investments, totalValue);

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: styles.grayText, cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #475569', paddingBottom: '12px', marginBottom: '20px' }}>
                    Detalhes do Histórico - {monthData.month}
                </h2>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: styles.inputBackground, padding: '12px', borderRadius: '8px' }}>
                    <p style={{ fontWeight: '600', color: styles.grayText }}>Total Registrado</p>
                    <p style={{ fontSize: '24px', fontWeight: '800', color: styles.primaryBlue }}>
                        {formatCurrencyEUR(monthData.total)}
                    </p>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: styles.whiteText, marginBottom: '10px' }}>
                    Composição do Portfólio:
                </h3>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
                    {aggregatedAssets.length > 0 ? (
                        aggregatedAssets.map((asset) => (
                            <div key={asset.category + '-' + asset.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: styles.cardBackground, borderRadius: '6px', 
                                // Concatenação segura para borderLeft
                                borderLeft: '4px solid ' + asset.color 
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: '600', color: styles.whiteText }}>
                                        {asset.name} <span style={{fontSize: '12px', color: styles.grayText}}>({asset.category})</span>
                                    </p>
                                    <p style={{ fontSize: '12px', color: styles.grayText }}>{asset.percentage}% do total</p>
                                </div>
                                <p style={{ fontWeight: 'bold', color: styles.whiteText }}>{formatCurrencyEUR(asset.value)}</p>
                            </div>
                        ))
                    ) : (
                         <p style={{ color: styles.grayText, textAlign: 'center' }}>Nenhum ativo registrado para este mês.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
// --- FIM DO COMPONENTE: DETALHES DO MÊS ---


export default function InvestmentCalculator() {
    const monthsList = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const [investments, setInvestments] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]); 
    const [monthlyContribution, setMonthlyContribution] = useState(0); 
    
    const [newInvestmentCategory, setNewInvestmentCategory] = useState(''); 
    const [newInvestmentAssetName, setNewInvestmentAssetName] = useState(''); 
    const [newInvestmentValue, setNewInvestmentValue] = useState(''); 
    
    const [selectedMonth, setSelectedMonth] = useState(monthsList[new Date().getMonth()]);
    const [contributionPercentages, setContributionPercentages] = useState({});
    
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    
    const [viewingMonth, setViewingMonth] = useState(null); 
    
    const monthPickerRef = useRef(null);


    const totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);

    const pieData = aggregatePieData(investments);
    
    const aggregatedAssetData = aggregateAssetData(investments, totalValue);
    
    // Efeito para fechar o seletor de mês ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (monthPickerRef.current && !monthPickerRef.current.contains(event.target)) {
                setIsMonthPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [monthPickerRef]);


    // --- LÓGICA DE APORTE E PERCENTUAL (POR CATEGORIA) ---
    useEffect(() => {
        if (pieData.length > 0) {
            const initialPercentages = {};
            pieData.forEach(data => {
                initialPercentages[data.name] = contributionPercentages[data.name] !== undefined ? contributionPercentages[data.name] : 0;
            });
            setContributionPercentages(initialPercentages);
        } else {
            setContributionPercentages({});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pieData.length]); 

    const handlePercentageChange = (name, value) => {
        const percentage = parseFloat(value) || 0;
        setContributionPercentages(prev => ({
            ...prev,
            [name]: percentage
        }));
    };

    const calculateContributionDistribution = () => {
        const totalPercentage = Object.values(contributionPercentages).reduce((sum, p) => sum + p, 0);
        
        if (totalPercentage === 0 || monthlyContribution === 0 || pieData.length === 0) {
            return pieData.map(data => ({
                ...data,
                contributionAmount: 0,
                manualPercentage: contributionPercentages[data.name] || 0
            }));
        }
        
        return pieData.map(data => {
            const percentage = contributionPercentages[data.name] || 0;
            const contributionAmount = (percentage / 100) * monthlyContribution;
            
            return {
                ...data,
                contributionAmount: contributionAmount.toFixed(2),
                manualPercentage: percentage
            };
        });
    };
    // -----------------------------------------------------------------


    // --- FUNÇÕES DE REGISTRO E CRUD DE INVESTIMENTOS ---
    
    const registerCurrentMonth = (currentTotal, currentInvestments) => {
        setMonthlyData((prevData) => { 
            const newMonthData = { 
                month: selectedMonth, 
                total: currentTotal,
                // Salva uma cópia profunda dos investimentos daquele momento
                investments: JSON.parse(JSON.stringify(currentInvestments)) 
            };
            
            if (prevData.some(data => data.month === selectedMonth)) {
                const updatedData = prevData.map(data => 
                    data.month === selectedMonth ? newMonthData : data
                );
                return updatedData;
            } else {
                const sortedData = [...prevData, newMonthData]
                    .sort((a, b) => monthsList.indexOf(a.month) - monthsList.indexOf(b.month));
                return sortedData;
            }
        });
    };
    
    const addInvestment = () => {
        const value = parseFloat(newInvestmentValue);
        
        let finalAssetName = newInvestmentAssetName.trim();
        const requiresName = CATEGORIES_REQUIRING_NAME.includes(newInvestmentCategory);
        
        if (!requiresName && finalAssetName === '') {
            finalAssetName = newInvestmentCategory;
        }

        if (!newInvestmentCategory || value <= 0 || (requiresName && finalAssetName === '')) {
            return; 
        }

        const newInv = {
            id: Date.now(),
            category: newInvestmentCategory, 
            name: finalAssetName,    
            value: value, 
            color: categoryColors[newInvestmentCategory] 
        };
        
        setInvestments(prev => {
            const updatedInvestments = [...prev, newInv];
            const newTotal = updatedInvestments.reduce((sum, inv) => sum + inv.value, 0);
            registerCurrentMonth(newTotal, updatedInvestments); 
            return updatedInvestments;
        });

        setNewInvestmentCategory('');
        setNewInvestmentAssetName(''); 
        setNewInvestmentValue('');
    };

    const removeAggregatedAsset = (individualIds) => {
        setInvestments(prev => {
            const updatedInvestments = prev.filter(inv => !individualIds.includes(inv.id));
            const newTotal = updatedInvestments.reduce((sum, inv) => sum + inv.value, 0);
            registerCurrentMonth(newTotal, updatedInvestments); 
            return updatedInvestments;
        });
    };
    
    const updateAggregatedAssetValue = (individualIds, newValue) => {
        const newTotalValue = parseFloat(newValue) || 0;

        setInvestments(prev => {
            const currentGroupTotal = prev.filter(inv => individualIds.includes(inv.id))
                                         .reduce((sum, inv) => sum + inv.value, 0);
            
            if (currentGroupTotal === 0) return prev; 
            
            const adjustmentFactor = newTotalValue / currentGroupTotal;

            const updatedInvestments = prev.map(inv => {
                if (individualIds.includes(inv.id)) {
                    // Distribui o novo valor proporcionalmente (se houver múltiplos IDs)
                    return { ...inv, value: inv.value * adjustmentFactor }; 
                }
                return inv;
            });
            
            const newTotal = updatedInvestments.reduce((sum, inv) => sum + inv.value, 0);
            registerCurrentMonth(newTotal, updatedInvestments); 
            return updatedInvestments;
        });
    };

    const handleManualRegistration = () => {
        if (investments.length === 0) return;
        registerCurrentMonth(totalValue, investments); 
    };
    
    const openMonthDetail = (data) => {
        setViewingMonth(data);
    };

    const closeMonthDetail = () => {
        setViewingMonth(null);
    };
    // -----------------------------------------------------------------

    const contributionDistributionData = calculateContributionDistribution();
    
    const totalManualPercentage = Object.values(contributionPercentages).reduce((sum, p) => sum + p, 0);
    const totalAllocatedContribution = contributionDistributionData.reduce((sum, data) => sum + parseFloat(data.contributionAmount), 0);
    
    const isAssetNameRequired = CATEGORIES_REQUIRING_NAME.includes(newInvestmentCategory);

    const isAddButtonDisabled = 
        !newInvestmentCategory || 
        parseFloat(newInvestmentValue) <= 0 || 
        (isAssetNameRequired && newInvestmentAssetName.trim() === ''); 


    // Renderizações
    const renderPieChart = () => { 
        if (investments.length === 0) {
            return (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: styles.grayText, flexDirection: 'column' }}>
                    <PieChartIcon size={40} style={{ marginBottom: '10px' }}/>
                    <p>Adicione investimentos para visualizar a distribuição.</p>
                </div>
            );
        }
        return (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        // Usando concatenação simples para a label
                        label={({ name, percent }) => name + ': ' + (percent * 100).toFixed(1) + '%'}
                        outerRadius={100}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={'cell-' + index} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                            return (
                                <div style={{ padding: '10px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    <p style={{ fontWeight: '600', color: '#1e293b' }}>{payload[0].name}</p>
                                    <p style={{ fontSize: '0.9em', color: '#475569' }}>
                                        {formatCurrencyEUR(payload[0].value)} (' + (Math.round(payload[0].percent * 1000) / 10) + '%)
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    }} />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const renderLineChart = () => {
        const lineChartData = monthlyData.map(d => ({ month: d.month, total: d.total }));

         if (lineChartData.length === 0) {
            return (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: styles.grayText, flexDirection: 'column' }}>
                    <TrendingUp size={30} style={{ marginBottom: '10px' }}/>
                    <p>Adicione/edite investimentos para iniciar o gráfico.</p>
                </div>
            );
        }
        return (
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineChartData.slice().sort((a,b) => monthsList.indexOf(a.month) - monthsList.indexOf(b.month))} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke={styles.grayText} />
                    <YAxis 
                        tickFormatter={(value) => formatCurrencyEUR(value).replace('€', '').trim()}
                        stroke={styles.grayText}
                    />
                    <Tooltip 
                        formatter={(value) => formatCurrencyEUR(value)}
                        labelFormatter={(label) => 'Mês: ' + label}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ r: 4 }} 
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    const renderMonthHistoryTable = () => {
        if (monthlyData.length === 0) {
            return null; 
        }

        return (
            <div style={{ marginTop: '20px', borderTop: '1px solid #475569', paddingTop: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: styles.whiteText, marginBottom: '10px' }}>
                    Detalhes do Registro Mensal (Clique em <Eye size={14} style={{ display: 'inline' }}/>)
                </h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', fontWeight: 'bold', color: styles.grayText, padding: '5px 0', borderBottom: '1px solid #475569', fontSize: '14px' }}>
                        <span>Mês</span>
                        <span style={{textAlign: 'right'}}>Total Registrado</span>
                        <span style={{width: '32px'}}></span> 
                    </div>
                    {monthlyData.slice().sort((a,b) => monthsList.indexOf(a.month) - monthsList.indexOf(b.month)).map((data) => (
                        <div key={data.month} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                            <span style={{ color: styles.grayText }}>{data.month}</span>
                            <span style={{ fontWeight: '600', color: styles.whiteText, textAlign: 'right', fontSize: '14px' }}>{formatCurrencyEUR(data.total)}</span>
                            <button
                                onClick={() => openMonthDetail(data)}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: styles.primaryBlue, 
                                    cursor: 'pointer', 
                                    padding: '4px', 
                                    marginLeft: '8px'
                                }}
                                // Concatenação segura
                                title={'Ver detalhes de ' + data.month} 
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // COMPONENTE SIMULADO DE CALENDÁRIO (MANTIDO)
    const MonthPicker = () => (
        <div 
            ref={monthPickerRef}
            style={{ 
                position: 'absolute', 
                top: '100%', 
                right: 0, 
                marginTop: '8px', 
                zIndex: 20, 
                display: isMonthPickerOpen ? 'block' : 'none' 
            }}
        >
            <div style={styles.monthGrid}>
                {monthsList.map((month) => (
                    <div
                        key={month}
                        onClick={() => {
                            setSelectedMonth(month);
                            setIsMonthPickerOpen(false);
                        }}
                        style={styles.monthButton(month === selectedMonth)}
                    >
                        {month}
                    </div>
                ))}
            </div>
        </div>
    );


    return (
        <div style={styles.container}>
            <div style={styles.mainContent}>
                
                {/* Cabeçalho */}
                <header style={styles.header}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', color: styles.whiteText, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                        <LayoutDashboard size={32} style={{ color: styles.primaryBlue }} />
                        Calculadora de Investimentos (€)
                    </h1>
                    <p style={{ color: styles.grayText }}>Gerencie e acompanhe seus investimentos</p>
                </header>

                {/* Bloco Principal (Adicionar Investimento) - Caixa Branca */}
                <div style={styles.whiteCard}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: styles.cardBackground, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Plus size={24} style={{ color: styles.primaryBlue }} />
                        Adicionar Investimento
                    </h2>
                    
                    {/* CONTAINER DO CALENDÁRIO E INPUTS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Linha 1: Seleção de Categoria */}
                        <select
                            value={newInvestmentCategory}
                            onChange={(e) => setNewInvestmentCategory(e.target.value)}
                            style={styles.select}
                        >
                            <option value="" disabled>1. Selecione a Categoria (Ações, ETF, ...)</option>
                            
                            {INVESTMENT_CATEGORIES.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                        
                        {/* CAMPO: Nome Específico do Ativo (Opcional ou Obrigatório) */}
                        <input
                            type="text"
                            // Concatenação simples para placeholder
                            placeholder={'2. Nome do Ativo (ex: AAPL, S&P 500) ' + (isAssetNameRequired ? ' *' : ' - Opcional')}
                            value={newInvestmentAssetName}
                            onChange={(e) => setNewInvestmentAssetName(e.target.value)}
                            style={{ ...styles.input, backgroundColor: 'white', color: '#1e293b', border: '1px solid #ccc' }}
                        />

                        {/* Linha 2: Valor e Ícone de Calendário (POSIÇÃO RELATIVA PARA O PICKER) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
                            <input
                                type="number"
                                placeholder="3. Valor (€) *" 
                                value={newInvestmentValue}
                                onChange={(e) => setNewInvestmentValue(e.target.value)}
                                style={{ ...styles.input, backgroundColor: 'white', color: '#1e293b', border: '1px solid #ccc', flexGrow: 1 }}
                            />
                            
                            {/* ÍCONE DE CALENDÁRIO COM MÊS ATUAL */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                <CalendarDays 
                                    size={28} 
                                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                                    style={{ 
                                        color: isMonthPickerOpen ? styles.secondaryBlue : styles.primaryBlue, 
                                        cursor: 'pointer' 
                                    }} 
                                    title={'Mês de Registro: ' + selectedMonth} 
                                />
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: styles.grayText, marginTop: '2px' }}>
                                    {selectedMonth}
                                </span>
                            </div>
                            
                            {/* POP-UP DE SELEÇÃO DE MÊS (GRADE) */}
                            <MonthPicker />
                        </div>

                        {/* Linha 3: Botão de Adicionar */}
                        <button
                            onClick={addInvestment}
                            disabled={isAddButtonDisabled}
                            style={{ ...styles.button, backgroundColor: styles.primaryBlue }}
                        >
                            Adicionar e Registrar em {selectedMonth}
                        </button>
                    </div>
                </div>

                {/* Card de Valor Total Investido - Card Azul Forte */}
                <div style={{ ...styles.card, backgroundColor: styles.primaryBlue, color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Euro size={20} style={{ color: 'white' }} />
                            Valor Total Investido (EUR)
                        </h2>
                        <p style={{ color: '#bfdbfe' }}>{investments.length} ativos individuais</p>
                    </div>
                    <p style={{ fontSize: '40px', fontWeight: '800', letterSpacing: '-0.025em' }}>
                        {formatCurrencyEUR(totalValue)}
                    </p>

                    <button
                        onClick={handleManualRegistration}
                        disabled={investments.length === 0 || monthlyData.some(d => d.month === selectedMonth && d.total === totalValue)}
                        style={{ 
                            marginTop: '16px',
                            backgroundColor: '#2563eb', 
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: (investments.length === 0 || monthlyData.some(d => d.month === selectedMonth && d.total === totalValue)) ? 'not-allowed' : 'pointer',
                            width: 'auto'
                        }}
                    >
                        Registrar Valor em {selectedMonth}
                    </button>
                </div>

                {/* Gráficos e Aportes */}
                <div style={styles.gridContainer}>
                    
                    <div style={{ ...styles.card, borderTop: '4px solid #f59e0b' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fcd34d', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <PieChartIcon size={20} />
                            Distribuição do Portfólio (por Categoria)
                        </h2>
                        {renderPieChart()}
                    </div>

                    <div style={{ ...styles.card, borderTop: '4px solid #10b981' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#34d399', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={20} />
                            Evolução Mensal (Histórico)
                        </h2>
                        {renderLineChart()}
                        {renderMonthHistoryTable()} 
                    </div>
                </div>

                {/* Lista de Ativos e Simulador de Aportes */}
                <div style={styles.gridContainer}>
                    
                    <div style={{ ...styles.card, borderTop: '4px solid #ef4444' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fca5a5', marginBottom: '16px' }}>Meus Ativos (€) - Agrupado (Nome + Categoria)</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                            {aggregatedAssetData.length > 0 ? (
                                aggregatedAssetData.map((asset) => (
                                    <div key={asset.category + '-' + asset.name} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', backgroundColor: styles.inputBackground, borderRadius: '8px' }}>
                                        <div 
                                            // Concatenação segura para border e background
                                            style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, border: '2px solid ' + asset.color, backgroundColor: asset.color }}
                                        ></div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 'bold', color: styles.whiteText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {asset.name} <span style={{fontSize: '12px', color: styles.grayText}}>({asset.category})</span>
                                            </p>
                                            <p style={{ fontSize: '12px', color: styles.grayText, fontWeight: '500' }}>
                                                {asset.percentage}% do total
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input
                                                type="number"
                                                value={asset.value} 
                                                onChange={(e) => updateAggregatedAssetValue(asset.individualIds, e.target.value)}
                                                style={{ ...styles.input, width: '80px', padding: '8px', fontSize: '14px' }}
                                            />
                                            <p style={{ fontWeight: 'bold', color: styles.whiteText, width: '100px', textAlign: 'right' }}>{formatCurrencyEUR(asset.value)}</p>
                                        </div>
                                        <button
                                            onClick={() => removeAggregatedAsset(asset.individualIds)}
                                            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: styles.grayText, textAlign: 'center', padding: '20px' }}>Nenhum ativo adicionado.</p>
                            )}
                        </div>
                    </div>

                    <div style={{ ...styles.card, borderTop: '4px solid #8b5cf6' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#c4b5fd', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Banknote size={20} />
                            Simulador de Aportes Mensais (€) - Por Categoria
                        </h2>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', color: styles.grayText, fontWeight: '600', marginBottom: '8px' }}>
                                1. Valor do Aporte Mensal (€)
                            </label>
                            <input
                                type="number"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
                                // Concatenação segura para border
                                style={{ ...styles.input, fontSize: '18px', fontWeight: 'bold', border: '1px solid #8b5cf6' }}
                            />
                        </div>

                        {/* OPÇÕES DE PORCENTAGEM DE APORTE (AGRUPADO por CATEGORIA) */}
                        <div style={{ backgroundColor: styles.inputBackground, borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                            <h3 style={{ fontWeight: 'bold', color: styles.whiteText, marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #475569' }}>
                                2. Defina a Porcentagem de Aporte (%)
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {pieData.length > 0 ? (
                                    // Mapeia sobre as CATEGORIAS AGRUPADAS (pieData)
                                    pieData.map((data) => (
                                        <div key={data.name} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            padding: '8px 0', 
                                            // Correção de String Constante (linha 731)
                                            borderLeft: '4px solid ' + data.color, 
                                            paddingLeft: '8px' 
                                        }}>
                                            <p style={{ fontWeight: '600', color: styles.whiteText, width: '40%' }}>{data.name}</p>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', width: '60%', justifyContent: 'flex-end' }}>
                                                <input
                                                    type="number"
                                                    value={contributionPercentages[data.name] || 0}
                                                    onChange={(e) => handlePercentageChange(data.name, e.target.value)}
                                                    max="100"
                                                    min="0"
                                                    style={{ ...styles.input, width: '70px', padding: '6px', fontSize: '14px', marginRight: '5px' }}
                                                />
                                                <span style={{ color: styles.grayText }}>%</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: styles.grayText, textAlign: 'center' }}>Adicione ativos para definir as porcentagens.</p>
                                )}
                            </div>
                            {/* Concatenação segura para border */}
                            <p style={{ color: totalManualPercentage > 100 ? '#ef4444' : '#34d399', fontWeight: 'bold', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #475569' }}>
                                Total Alocado: {totalManualPercentage.toFixed(1)}%
                            </p>
                        </div>
                        
                        {/* RESULTADO DA DISTRIBUIÇÃO (AGRUPADO por CATEGORIA) */}
                        <div style={{ backgroundColor: styles.inputBackground, borderRadius: '8px', padding: '16px' }}>
                            <h3 style={{ fontWeight: 'bold', color: styles.whiteText, marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #475569' }}>
                                3. Resultado da Distribuição:
                            </h3>
                            <p style={{ color: styles.grayText, marginBottom: '12px' }}>
                                Total Alocado: <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{formatCurrencyEUR(totalAllocatedContribution)}</span>
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '50px' }}>
                                {contributionDistributionData.length > 0 ? (
                                    // Mapeia sobre os DADOS AGRUPADOS de contribuição
                                    contributionDistributionData.map((data) => (
                                        <div key={data.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: styles.cardBackground, borderRadius: '6px', 
                                            // Concatenação segura para borderLeft
                                            borderLeft: '4px solid ' + data.color 
                                        }}>
                                            <div>
                                                <p style={{ fontWeight: '600', color: styles.whiteText }}>{data.name}</p>
                                                <p style={{ fontSize: '12px', color: styles.grayText }}>{data.manualPercentage}%</p>
                                            </div>
                                            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>
                                                {formatCurrencyEUR(parseFloat(data.contributionAmount))}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: styles.grayText, textAlign: 'center' }}>Adicione ativos para ver a distribuição.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Componente Modal para Detalhes do Mês (Drill Down) */}
            <MonthDetailModal 
                monthData={viewingMonth} 
                onClose={closeMonthDetail} 
            />
        </div>
    );
}