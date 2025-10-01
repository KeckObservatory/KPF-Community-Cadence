
import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useCommCadContext } from '../App';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export type Integer = number | string;

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

type Dashboards = "Single Target" | "Semester" | "Semid" | "Nightplan" | "Admin";



export const ComponentSelector = () => {
    const [value, setValue] = React.useState(0);

    const context = useCommCadContext();

    const dashboards = context.isAdmin ? ["Single Target", "Semester", "Semid", "Nightplan", "Admin"] : ["Single Target", "Semester", "Semid", "Nightplan"]


    //@ts-ignore
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs
                value={value}
                onChange={handleChange}
                aria-label="cc-module-tabs"
            >
                {dashboards.map((dashboard, index) => (
                    <Tab key={index} value={index} label={dashboard} {...a11yProps(index)} />
                ))}
            </Tabs>
            {
                dashboards.map((dashboard, index) => (
                    <CustomTabPanel key={index} value={value} index={index}>
                        {dashboard} Dashboard goes here.
                    </CustomTabPanel>
                ))
            }
        </Box>
    );
}